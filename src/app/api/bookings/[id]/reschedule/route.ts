import { NextRequest } from "next/server";
import { prisma, isMockPrisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const authUser = await getAuthUser();
    if (!authUser) {
      return errorResponse("Authentication required", 401);
    }

    const bookingRateLimit = checkRateLimit(`booking_reschedule:${authUser.userId}`, 10, 60_000);
    if (!bookingRateLimit.ok) {
      return errorResponse("予約リクエストが多すぎます。少し待ってから再試行してください。", 429);
    }

    const body = await request.json();
    const { availabilityId, userNote } = body;

    if (!availabilityId) {
      return errorResponse("新しい予約日時が選択されていません", 400);
    }

    if (isMockPrisma) {
      return errorResponse("モック環境では予約変更はサポートされていません", 400);
    }

    // 1. Validate the old booking
    const oldBooking = await prisma.booking.findFirst({
      where: { id: BigInt(String(bookingId)), userId: BigInt(authUser.userId) },
      include: {
        menu: { select: { durationMin: true } },
        availability: true,
        artist: { select: { userId: true } }
      }
    });

    if (!oldBooking) {
      return errorResponse("Booking not found", 404);
    }

    if (oldBooking.status !== "PENDING" && oldBooking.status !== "CONFIRMED") {
      return errorResponse("この予約は変更できません", 400);
    }

    // Check if the old booking is within 12 hours
    const bookingDateStr = oldBooking.availability.date.toISOString().split("T")[0];
    const bookingTimeStr = oldBooking.availability.startTime.toISOString().slice(11, 19);
    // Assuming JST (+09:00) for the appointment time
    const bookingDateTime = new Date(`${bookingDateStr}T${bookingTimeStr}+09:00`);
    const now = new Date();
    
    const hoursDiff = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursDiff <= 12) {
      return errorResponse("予約時間の12時間前を過ぎているため、日時の変更はできません。", 400);
    }

    // 2. Find and lock new availability
    const newAvailability = await prisma.availability.findUnique({
      where: { id: BigInt(String(availabilityId)) },
    });

    if (!newAvailability || newAvailability.status !== "AVAILABLE") {
      return errorResponse("この枠は現在予約できません", 400);
    }

    if (newAvailability.artistId !== oldBooking.artistId) {
      return errorResponse("無効な日時が選択されました", 400);
    }

    const durationMin = oldBooking.menu?.durationMin || 60; // fallback 60 for consultation
    const requiredSlotsCount = Math.ceil(durationMin / 30);

    const result = await prisma.$transaction(async (tx: any) => {
      // Free old slots
      await tx.availability.update({
        where: { id: oldBooking.availabilityId },
        data: { status: "AVAILABLE", version: { increment: 1 } },
      });
      await tx.availability.updateMany({
        where: { blockedByBookingId: oldBooking.id },
        data: { status: "AVAILABLE", blockedByBookingId: null, version: { increment: 1 } },
      });

      // Find new subsequent slots
      let blockedSlotIds: bigint[] = [];
      if (requiredSlotsCount > 1) {
        const potentialSlots = await tx.availability.findMany({
          where: {
            artistId: newAvailability.artistId,
            date: newAvailability.date,
            startTime: { gte: newAvailability.startTime },
            status: "AVAILABLE",
          },
          orderBy: { startTime: "asc" },
          take: requiredSlotsCount,
        });

        if (potentialSlots.length < requiredSlotsCount) {
          throw new Error("INSUFFICIENT_CONSECUTIVE_SLOTS");
        }

        for (let i = 1; i < potentialSlots.length; i++) {
          const prev = potentialSlots[i - 1]!.startTime.getTime();
          const curr = potentialSlots[i]!.startTime.getTime();
          if (curr - prev !== 1800000) {
            throw new Error("NON_CONTIGUOUS_SLOTS");
          }
        }

        blockedSlotIds = potentialSlots.slice(1).map((s: any) => s.id);
      }

      // Lock new primary
      const updatedPrimary = await tx.availability.updateMany({
        where: {
          id: newAvailability.id,
          status: "AVAILABLE",
          version: newAvailability.version,
        },
        data: { status: "BOOKED", version: { increment: 1 } },
      });

      if (updatedPrimary.count === 0) {
        throw new Error("DOUBLE_BOOKING_CONFLICT");
      }

      // Lock new blocked
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

      // Disconnect old blocked slots and connect new ones, update primary slot
      const updatedBooking = await tx.booking.update({
        where: { id: oldBooking.id },
        data: {
          availabilityId: newAvailability.id,
          status: "PENDING",
          userNote: userNote !== undefined ? userNote : oldBooking.userNote,
          blockedSlots: {
            set: blockedSlotIds.map((id) => ({ id })),
          }
        }
      });

      // Notification
      await tx.notification.create({
        data: {
          userId: oldBooking.artist.userId,
          type: "booking_rescheduled",
          title: "予約日時が変更されました",
          body: `${oldBooking.availability.date.toISOString().split("T")[0]} から ${newAvailability.date.toISOString().split("T")[0]} へ予約日時が変更されました。`,
          isRead: false,
        },
      });

      return updatedBooking;
    });

    return successResponse(
      {
        id: result.id.toString(),
        status: result.status,
      },
      200,
    );

  } catch (error) {
    console.error("Reschedule booking error:", error);
    if (error instanceof Error) {
      if (error.message === "DOUBLE_BOOKING_CONFLICT") {
        return errorResponse("申し訳ありません。この枠は直前に他の方に予約されてしまいました。", 409);
      }
      if (error.message === "INSUFFICIENT_CONSECUTIVE_SLOTS" || error.message === "NON_CONTIGUOUS_SLOTS") {
        return errorResponse("選択したメニューに必要な連続した空き時間が確保できませんでした。", 400);
      }
    }
    return errorResponse("Internal server error", 500);
  }
}
