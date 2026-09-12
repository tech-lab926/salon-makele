import { NextRequest, after } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import {
  sendEmail,
  bookingConfirmedEmail,
  bookingConfirmedEmailToArtist,
  bookingCancelledEmailForUser,
  bookingCancelledEmailForArtist,
  bookingCompletedEmail,
  bookingCompletedEmailToArtist,
} from "@/lib/email";
import { formatDate, formatTime, formatBookingTime } from "@/lib/utils";

function normalizeBookingStatus(status: string): string {
  return status.toLowerCase();
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return errorResponse("Authentication required", 401);
    }

    const ip = clientIp(request);
    const limitCheck = checkRateLimit(`booking-update:${authUser.userId}:${ip}`, 10, 10 * 60_000);
    if (!limitCheck.ok) {
      return errorResponse("操作の回数が上限に達しました。しばらく待ってから再度お試しください。", 429);
    }

    const { id } = await params;
    const body = await request.json();
    const status = normalizeBookingStatus(body.status || "");
    // Cap note length to prevent DB bloat and email injection vectors.
    const artistNote = typeof body.artistNote === "string" ? body.artistNote.trim().slice(0, 1000) || null : undefined;

    if (!/^\d+$/.test(id)) return errorResponse("Invalid booking ID", 400);
    const booking = await prisma.booking.findUnique({
      where: { id: BigInt(id) },
      include: {
        availability: true,
        user: { select: { name: true, email: true } },
        artist: {
          select: {
            id: true,
            userId: true,
            displayName: true,
            user: { select: { email: true } },
          },
        },
        menu: { select: { name: true, durationMin: true, price: true } },
      },
    });

    if (!booking) {
      return errorResponse("Booking not found", 404);
    }

    const isOwner = booking.userId.toString() === authUser.userId;
    const isArtist = booking.artist.userId.toString() === authUser.userId;
    const isAdmin = authUser.role === "admin";

    if (!isOwner && !isArtist && !isAdmin) {
      return errorResponse("Forbidden", 403);
    }

    if (!status && artistNote !== undefined && (isArtist || isAdmin)) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { artistNote },
      });
      return successResponse({ message: "Artist note updated" });
    }

    if (status === "cancelled") {
      if (
        booking.status !== BookingStatus.PENDING &&
        booking.status !== BookingStatus.CONFIRMED
      ) {
        return errorResponse("この予約はキャンセルできません", 400);
      }
      const cancelledBy = isOwner ? "user" : isArtist ? "artist" : "admin";

      await prisma.$transaction(async (tx: any) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: "CANCELLED",
            cancelledBy,
            cancelledAt: new Date(),
          },
        });

        await tx.availability.update({
          where: { id: booking.availabilityId },
          data: { status: "AVAILABLE", version: { increment: 1 } },
        });

        const restoredByLink = await tx.availability.updateMany({
          where: { blockedByBookingId: booking.id },
          data: {
            status: "AVAILABLE",
            blockedByBookingId: null,
            version: { increment: 1 },
          },
        });

        if (
          restoredByLink.count === 0 &&
          booking.menu &&
          booking.menu.durationMin > 30
        ) {
          const slotsToRestore = Math.ceil(booking.menu.durationMin / 30) - 1;
          const blockedSlots = await tx.availability.findMany({
            where: {
              artistId: booking.artist.id,
              date: booking.availability.date,
              startTime: { gt: booking.availability.startTime },
              status: "BLOCKED",
            },
            orderBy: { startTime: "asc" },
            take: slotsToRestore,
          });

          await tx.availability.updateMany({
            where: { id: { in: blockedSlots.map((bs: any) => bs.id) } },
            data: { status: "AVAILABLE", version: { increment: 1 } },
          });
        }

        const byLabel =
          cancelledBy === "user"
            ? "ユーザー"
            : cancelledBy === "artist"
              ? "アーティスト"
              : "管理者";

        await tx.notification.create({
          data: {
            userId: booking.userId,
            type: "booking_cancelled",
            title: "予約がキャンセルされました",
            body:
              cancelledBy === "user"
                ? "ご予約をキャンセルしました。"
                : `${byLabel}により、${booking.artist.displayName}との予約がキャンセルされました。`,
            refId: booking.id,
            refType: "booking",
          },
        });

        await tx.notification.create({
          data: {
            userId: booking.artist.userId,
            type: "booking_cancelled",
            title: "予約がキャンセルされました",
            body:
              cancelledBy === "artist"
                ? "ご予約をキャンセルしました。"
                : cancelledBy === "user"
                  ? `${booking.user.name}様が予約をキャンセルしました。`
                  : `運営により、${booking.user.name}様との予約がキャンセルされました。`,
            refId: booking.id,
            refType: "booking",
          },
        });
      });

      const dateStr = formatDate(booking.availability.date);
      const timeStr = formatBookingTime(booking.availability.startTime, booking.menu?.durationMin);
      const cb = cancelledBy as "user" | "artist" | "admin";
      const userMail = bookingCancelledEmailForUser({
        userName: booking.user.name,
        artistName: booking.artist.displayName,
        date: dateStr,
        time: timeStr,
        cancelledBy: cb,
      });
      const artistMail = bookingCancelledEmailForArtist({
        customerName: booking.user.name,
        date: dateStr,
        time: timeStr,
        cancelledBy: cb,
      });
      // Trigger emails asynchronously in the background using after to prevent freezing in serverless and preserve timing attack immunity
      after(() => {
        Promise.all([
          sendEmail({ to: booking.user.email, ...userMail }),
          sendEmail({ to: booking.artist.user.email, ...artistMail })
        ]).catch((e) => {
          console.error("Failed to send cancellation emails in background:", e);
        });
      });

      return successResponse({ message: "Booking cancelled" });
    }

    if (status === "confirmed" && (isArtist || isAdmin)) {
      if (booking.status !== BookingStatus.PENDING) {
        return errorResponse("確定できるのは承認待ちの予約のみです", 400);
      }
      await prisma.$transaction(async (tx: any) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "CONFIRMED", artistNote: artistNote || booking.artistNote },
        });

        await tx.notification.create({
          data: {
            userId: booking.userId,
            type: "booking_confirmed",
            title: "予約が確定しました",
            body: `${booking.artist.displayName}とのご予約が確定しました。`,
            refId: booking.id,
            refType: "booking",
          },
        });

        await tx.notification.create({
          data: {
            userId: booking.artist.userId,
            type: "booking_confirmed",
            title: "予約を確定しました",
            body: `${booking.user.name}様との予約を確定しました。`,
            refId: booking.id,
            refType: "booking",
          },
        });
      });

      const dateStr = formatDate(booking.availability.date);
      const timeStr = formatBookingTime(booking.availability.startTime, booking.menu?.durationMin);
      const confirmEmail = bookingConfirmedEmail(
        booking.user.name,
        booking.artist.displayName,
        dateStr,
        timeStr,
      );
      const confirmArtistEmail = bookingConfirmedEmailToArtist(
        booking.user.name,
        dateStr,
        timeStr,
      );
      // Trigger emails asynchronously in the background using after to prevent freezing in serverless and preserve timing attack immunity
      after(() => {
        Promise.all([
          sendEmail({ to: booking.user.email, ...confirmEmail }),
          sendEmail({ to: booking.artist.user.email, ...confirmArtistEmail })
        ]).catch((e) => {
          console.error("Failed to send confirmation emails in background:", e);
        });
      });

      return successResponse({ message: "Booking confirmed" });
    }

    if (status === "completed" && (isArtist || isAdmin)) {
      if (booking.status !== BookingStatus.CONFIRMED) {
        return errorResponse("完了にできるのは確定済みの予約のみです", 400);
      }
      
      const { getArtistActivePlan } = await import("@/lib/subscription");
      const activePlanInfo = await getArtistActivePlan(booking.artist.id);
      
      // Attempt to capture Stripe payment
      const paymentIntentId = (booking as any).stripePaymentIntentId;
      if (paymentIntentId) {
        try {
          const { stripe } = await import("@/lib/stripe");
          await stripe.paymentIntents.capture(paymentIntentId);
        } catch (e) {
          console.error("Failed to capture Stripe payment:", e);
          return errorResponse("決済の確定に失敗しました。カードの残高や有効期限をご確認ください。", 500);
        }
      }

      await prisma.$transaction(async (tx: any) => {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "COMPLETED" },
        });

        if (booking.menu && booking.menu.price) {
          const feeAmount = Math.floor(booking.menu.price * Number(activePlanInfo.plan.feeRate));
          await tx.bookingFee.create({
            data: {
              artistId: booking.artist.id,
              bookingId: booking.id,
              menuPrice: booking.menu.price,
              feeRate: activePlanInfo.plan.feeRate,
              feeAmount,
              status: "PENDING",
            }
          });
        }

        await tx.notification.create({
          data: {
            userId: booking.userId,
            type: "booking_completed",
            title: "施術が完了しました",
            body: `${booking.artist.displayName}との施術が完了しました。ご利用ありがとうございました。`,
            refId: booking.id,
            refType: "booking",
          },
        });

        await tx.notification.create({
          data: {
            userId: booking.artist.userId,
            type: "booking_completed",
            title: "施術を完了にしました",
            body: `${booking.user.name}様との施術を完了として記録しました。`,
            refId: booking.id,
            refType: "booking",
          },
        });
      });

      const dateStr = formatDate(booking.availability.date);
      const timeStr = formatBookingTime(booking.availability.startTime, booking.menu?.durationMin);
      const completedEmail = bookingCompletedEmail(
        booking.user.name,
        booking.artist.displayName,
        dateStr,
        timeStr,
      );
      const completedArtistEmail = bookingCompletedEmailToArtist(
        booking.user.name,
        dateStr,
        timeStr,
      );
      // Trigger emails asynchronously in the background using after to prevent freezing in serverless and preserve timing attack immunity
      after(() => {
        Promise.all([
          sendEmail({ to: booking.user.email, ...completedEmail }),
          sendEmail({ to: booking.artist.user.email, ...completedArtistEmail })
        ]).catch((e) => {
          console.error("Failed to send completion emails in background:", e);
        });
      });

      return successResponse({ message: "Booking marked as completed" });
    }

    return errorResponse("Invalid status update", 400);
  } catch (error) {
    console.error("Booking update error:", error);
    return errorResponse("Internal server error", 500);
  }
}
