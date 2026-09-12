import { NextRequest } from "next/server";
import { prisma, isMockPrisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, paginatedResponse, successResponse } from "@/lib/api-response";
import { getPageRange } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail, newBookingNotificationEmail, bookingRequestReceivedEmail } from "@/lib/email";

import { bookingCreateSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return errorResponse("Authentication required", 401);
    }

    // Rate limit: 10 booking attempts per user per minute to prevent availability-slot abuse.
    const bookingRateLimit = checkRateLimit(`booking:${authUser.userId}`, 10, 60_000);
    if (!bookingRateLimit.ok) {
      return errorResponse("予約リクエストが多すぎます。少し待ってから再試行してください。", 429);
    }

    const body = await request.json();
    const result = bookingCreateSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(result.error.issues[0]?.message || "Validation failed", 400);
    }
    const { availabilityId, menuId, userNote, stripePaymentMethodId } = result.data;

    if (isMockPrisma) {
      // --- Simplified Mock Booking Logic for Demo ---
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = (prisma as unknown as { _dbData: Record<string, any[]> })._dbData;
      const availability = db.availability.find((a: { id: { toString(): string }; status: string; artistId: bigint; date: string }) => a.id.toString() === availabilityId.toString());
      let menu;
      if (typeof menuId === "string" && menuId.startsWith("consultation_")) {
        const duration = menuId === "consultation_60" ? 60 : 30;
        menu = {
          id: null,
          name: `無料カウンセリング (${duration}分)`,
          durationMin: duration,
        };
      } else {
        menu = db.menus.find((m: { id: { toString(): string }; name: string }) => m.id.toString() === menuId.toString());
      }

      if (!availability || availability.status !== "available") {
        return errorResponse("この枠は現在予約できません", 400);
      }
      if (!menu) {
        return errorResponse("メニューが見つかりません", 400);
      }

      const newBooking = {
        id: BigInt(Date.now()),
        userId: BigInt(authUser.userId),
        artistId: availability.artistId,
        availabilityId: availability.id,
        menuId: menu.id,
        userNote: (typeof menuId === "string" && menuId.startsWith("consultation_")) 
          ? `[${menu.name}]\n${userNote || ""}`.trim() 
          : (userNote || null),
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
        artist: db.artists.find((a: { id: bigint }) => a.id === availability.artistId),
        menu: menu,
        availability: availability
      };

      db.bookings.push(newBooking);
      availability.status = "booked";

      db.notifications.push({
        id: BigInt(Date.now() + 1),
        userId: availability.artistId,
        type: "new_booking",
        title: "新しい予約リクエスト",
        body: `${availability.date} の予約リクエストが届きました。`,
        isRead: false,
        createdAt: new Date(),
      });

      return successResponse({
        id: newBooking.id.toString(),
        status: newBooking.status,
        artistName: newBooking.artist.displayName,
        date: availability.date,
      }, 201);
    }

    const availability = await prisma.availability.findUnique({
      where: { id: BigInt(String(availabilityId)) },
      include: { artist: { select: { id: true, userId: true, displayName: true } } },
    });
    if (!availability || availability.status !== "AVAILABLE") {
      return errorResponse("この枠は現在予約できません", 400);
    }

    let menu;
    if (typeof menuId === "string" && menuId.startsWith("consultation_")) {
      const duration = menuId === "consultation_60" ? 60 : 30;
      menu = {
        id: null,
        name: `無料カウンセリング (${duration}分)`,
        artistId: availability.artistId,
        durationMin: duration,
        price: 0,
      };
    } else {
      menu = await prisma.menu.findUnique({
        where: { id: BigInt(String(menuId)) },
        select: { id: true, name: true, artistId: true, durationMin: true, price: true },
      });
    }

    if (!menu) {
      return errorResponse("メニューが見つかりません", 400);
    }

    if (menu.artistId !== availability.artistId) {
      return errorResponse("無効なメニューが選択されました", 400);
    }

    // Requirements §8.2: Multi-slot blocking based on duration_min
    const requiredSlotsCount = Math.ceil(menu.durationMin / 30);

    let stripePaymentIntentId = null;
    const user = await prisma.user.findUnique({ 
      where: { id: BigInt(authUser.userId) }, 
      select: { stripeCustomerId: true, name: true, email: true } 
    });
    
    if (menu.price && stripePaymentMethodId) {
      try {
        const { stripe } = await import("@/lib/stripe");
        let customerId = user?.stripeCustomerId;
        
        // Ensure customer exists
        if (!customerId) {
          const customer = await stripe.customers.create({
            name: user?.name || "Unknown",
            email: user?.email || undefined,
          });
          customerId = customer.id;
          await prisma.user.update({
            where: { id: BigInt(authUser.userId) },
            data: { stripeCustomerId: customerId },
          });
        }

        // Attach PaymentMethod to Customer
        await stripe.paymentMethods.attach(stripePaymentMethodId, {
          customer: customerId,
        });

        // Set as default payment method for future off-session payments (if needed)
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: stripePaymentMethodId,
          },
        });

        // Create PaymentIntent with manual capture
        const intent = await stripe.paymentIntents.create({
          amount: menu.price,
          currency: "jpy",
          customer: customerId,
          payment_method: stripePaymentMethodId,
          capture_method: "manual",
          confirm: true,
          // Since it's manual capture, we don't need to confirm on client side if we have the PM ID
          // But we need to handle 3DS if required. For now, assuming simple flow.
          automatic_payment_methods: { enabled: true, allow_redirects: "never" },
        });
        stripePaymentIntentId = intent.id;
      } catch (e) {
        console.error("Stripe payment logic failed:", e);
        return errorResponse("決済の準備に失敗しました。カード情報をご確認ください。", 500);
      }
    }

    const booking = await prisma.$transaction(async (tx: any) => {
      // 1. If more than 1 slot is needed, find and lock the adjacent slots
      let blockedSlotIds: bigint[] = [];
      if (requiredSlotsCount > 1) {
        // Find next slots: same artist, same date, startTime >= primary startTime
        const potentialSlots = await tx.availability.findMany({
          where: {
            artistId: availability.artistId,
            date: availability.date,
            startTime: { gte: availability.startTime },
            status: "AVAILABLE",
          },
          orderBy: { startTime: "asc" },
          take: requiredSlotsCount,
        });

        if (potentialSlots.length < requiredSlotsCount) {
          throw new Error("INSUFFICIENT_CONSECUTIVE_SLOTS");
        }

        // Verify they are actually contiguous (30 min apart)
        for (let i = 1; i < potentialSlots.length; i++) {
          const prev = potentialSlots[i - 1]!.startTime.getTime();
          const curr = potentialSlots[i]!.startTime.getTime();
          if (curr - prev !== 1800000) {
            // 30 min in ms
            throw new Error("NON_CONTIGUOUS_SLOTS");
          }
        }

        blockedSlotIds = potentialSlots.slice(1).map((s: any) => s.id);
      }

      // 2. Lock the primary slot (Optimistic locking with version)
      const updatedPrimary = await tx.availability.updateMany({
        where: {
          id: availability.id,
          status: "AVAILABLE",
          version: availability.version,
        },
        data: { status: "BOOKED", version: { increment: 1 } },
      });

      if (updatedPrimary.count === 0) {
        throw new Error("DOUBLE_BOOKING_CONFLICT");
      }

      // 3. Lock subsequent slots as BLOCKED
      if (blockedSlotIds.length > 0) {
        const updatedBlocked = await tx.availability.updateMany({
          where: { id: { in: blockedSlotIds }, status: "AVAILABLE" },
          data: {
            status: "BLOCKED",
            version: { increment: 1 },
          },
        });
        if (updatedBlocked.count !== blockedSlotIds.length) {
          throw new Error("DOUBLE_BOOKING_CONFLICT");
        }
      }

      // 4. Create the booking record
      const finalUserNote = (typeof menuId === "string" && menuId.startsWith("consultation_"))
        ? `[${menu.name}]\n${userNote || ""}`.trim()
        : userNote || null;

      const created = await tx.booking.create({
        data: {
          userId: BigInt(authUser.userId),
          artistId: availability.artistId,
          availabilityId: availability.id,
          menuId: menu.id,
          userNote: finalUserNote,
          status: "PENDING",
          stripePaymentIntentId,
          // Link blocked slots for easy restoration on cancel
          blockedSlots: {
            connect: blockedSlotIds.map((id: any) => ({ id })),
          },
        },
      });

      await tx.notification.create({
        data: {
          userId: availability.artist.userId,
          type: "new_booking",
          title: "新しい予約リクエスト",
          body: `${availability.date.toISOString().split("T")[0]} の予約リクエストが届きました。`,
          isRead: false,
        },
      });

      return created;
    });

    // 1. Send email to artist
    const artistUser = await prisma.user.findUnique({
      where: { id: availability.artist.userId },
      select: { email: true }
    });
    const dateStr = availability.date.toISOString().split("T")[0];
    const timeStr = availability.startTime.toISOString().slice(11, 16);

    if (artistUser?.email) {
      const emailContent = newBookingNotificationEmail(
        availability.artist.displayName,
        dateStr,
        timeStr
      );
      sendEmail({ to: artistUser.email, ...emailContent }).catch(e => console.error("Failed to send new booking email to artist", e));
    }

    // 2. Send receipt email to user
    if (user?.email) {
      const userEmailContent = bookingRequestReceivedEmail(
        user.name || "お客様",
        availability.artist.displayName,
        dateStr,
        timeStr
      );
      sendEmail({ to: user.email, ...userEmailContent }).catch(e => console.error("Failed to send booking receipt to user", e));
    }

    return successResponse(
      {
        id: booking.id.toString(),
        status: booking.status,
        artistName: availability.artist.displayName,
        date: availability.date.toISOString().split("T")[0],
      },
      201,
    );
  } catch (error) {
    console.error("Booking error:", error);
    if (error instanceof Error) {
      if (error.message === "DOUBLE_BOOKING_CONFLICT") {
        return errorResponse(
          "申し訳ありません。この枠は直前に他の方に予約されてしまいました。",
          409,
        );
      }
      if (
        error.message === "INSUFFICIENT_CONSECUTIVE_SLOTS" ||
        error.message === "NON_CONTIGUOUS_SLOTS"
      ) {
        return errorResponse(
          "選択したメニューに必要な連続した空き時間が確保できませんでした。",
          400,
        );
      }
    }
    return errorResponse("Internal server error", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return errorResponse("Authentication required", 401);
    }

    if (!/^\d+$/.test(authUser.userId)) {
      return errorResponse("Invalid user id", 401);
    }
    const userId = authUser.userId;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || 50),
    );
    const { skip, take } = getPageRange(page, limit);
    const where = { userId: BigInt(userId) };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          artist: { select: { displayName: true, profileImgUrl: true, lineUrl: true } },
          menu: { select: { name: true, price: true, durationMin: true } },
          availability: { select: { date: true, startTime: true, endTime: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const serialized = bookings.map((b: any) => ({
      id: b.id.toString(),
      status: b.status,
      artistId: b.artistId.toString(),
      menuId: b.menuId ? b.menuId.toString() : null,
      artist: { displayName: b.artist.displayName, profileImgUrl: b.artist.profileImgUrl, lineUrl: b.artist.lineUrl },
      menu: b.menu ? { name: b.menu.name, price: b.menu.price, durationMin: b.menu.durationMin } : null,
      date: b.availability.date.toISOString().split("T")[0],
      startTime: b.availability.startTime.toISOString().slice(11, 16),
      endTime: b.availability?.startTime && b.menu?.durationMin
        ? new Date(b.availability.startTime.getTime() + b.menu.durationMin * 60000).toISOString().slice(11, 16)
        : b.availability.endTime.toISOString().slice(11, 16),
      createdAt: b.createdAt.toISOString(),
    }));

    return paginatedResponse(serialized, Number(total), page, limit);
  } catch (error) {
    console.error("Bookings list error:", error);
    return errorResponse("Internal server error", 500);
  }
}
