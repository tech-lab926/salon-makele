import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  AVAILABILITY_QUERY_MAX_ROWS,
  calendarMonthUtcBounds,
  defaultTokyoCalendarMonthUtcBounds,
} from "@/lib/availability-slot";
import { getAuthUser } from "@/lib/auth";

/**
 * Public calendar: every slot in range with ○/× semantics.
 * - `bookable` + `id`: only when status is available (client may book).
 * - Booked/blocked: times shown as unavailable; `id` omitted (no customer data).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");
    const month = searchParams.get("month");
    const rescheduleBookingId = searchParams.get("rescheduleBookingId");

    if (!artistId || !/^\d+$/.test(artistId)) {
      return errorResponse("Invalid artistId", 400);
    }
    const artistBigInt = BigInt(artistId);

    const publishedArtist = await prisma.artist.findFirst({
      where: {
        id: artistBigInt,
        isPublished: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!publishedArtist) {
      return errorResponse("Artist not found", 404);
    }

    const where: Record<string, unknown> = {
      artistId: artistBigInt,
      status: { in: ["AVAILABLE", "BOOKED", "BLOCKED"] },
    };

    if (month) {
      const parts = month.split("-");
      if (parts.length !== 2) {
        return errorResponse("month must be YYYY-MM", 400);
      }
      const year = Number(parts[0]);
      const m = Number(parts[1]);
      if (
        !Number.isFinite(year) ||
        !Number.isFinite(m) ||
        m < 1 ||
        m > 12
      ) {
        return errorResponse("Invalid month", 400);
      }
      const { start, end } = calendarMonthUtcBounds(year, m);
      where.date = { gte: start, lte: end };
    } else {
      const { start, end } = defaultTokyoCalendarMonthUtcBounds();
      where.date = { gte: start, lte: end };
    }

    let userBookingSlots: bigint[] = [];
    if (rescheduleBookingId && /^\d+$/.test(rescheduleBookingId)) {
      const authUser = await getAuthUser();
      if (authUser) {
        const booking = await prisma.booking.findUnique({
          where: { id: BigInt(rescheduleBookingId), userId: BigInt(authUser.userId) },
        });
        if (booking) {
          userBookingSlots.push(booking.availabilityId);
          const blocked = await prisma.availability.findMany({
            where: { blockedByBookingId: booking.id },
            select: { id: true },
          });
          blocked.forEach((b: any) => userBookingSlots.push(b.id));
        }
      }
    }

    const slots = await prisma.availability.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: AVAILABILITY_QUERY_MAX_ROWS,
    });

    const serialized = slots.map((s: any) => {
      const isOwnedByReschedule = userBookingSlots.includes(s.id);
      const bookable = s.status === "AVAILABLE" || isOwnedByReschedule;
      return {
        ...(bookable ? { id: s.id.toString() } : {}),
        date: s.date.toISOString().split("T")[0],
        startTime: s.startTime.toISOString().slice(11, 16),
        endTime: s.endTime.toISOString().slice(11, 16),
        bookable,
      };
    });

    return successResponse(serialized, 200, { skipSerialization: true });
  } catch (error) {
    console.error("Availability error:", error);
    return errorResponse("Internal server error", 500);
  }
}
