import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  validateHourlySlotShape,
  prismaTimeFromHm,
  calendarMonthUtcBounds,
  defaultTokyoCalendarMonthUtcBounds,
  AVAILABILITY_QUERY_MAX_ROWS,
} from "@/lib/availability-slot";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "artist") {
      return errorResponse("Unauthorized", 401);
    }

    const artist = await prisma.artist.findFirst({
      where: { userId: BigInt(user.userId), deletedAt: null },
    });
    if (!artist) return errorResponse("Artist profile not found", 404);

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    const where: Record<string, unknown> = { artistId: artist.id };

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

    const slots = await prisma.availability.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: AVAILABILITY_QUERY_MAX_ROWS,
      include: {
        booking: {
          select: { id: true, status: true, user: { select: { name: true } } },
        },
      },
    });

    const serialized = slots.map((s: any) => ({
      id: s.id.toString(),
      date: s.date.toISOString().split("T")[0],
      startTime: s.startTime.toISOString().slice(11, 16),
      endTime: s.endTime.toISOString().slice(11, 16),
      status: s.status,
      booking: s.booking
        ? {
            id: s.booking.id.toString(),
            status: s.booking.status,
            userName: s.booking.user?.name || "Guest",
          }
        : null,
    }));

    return successResponse(serialized, 200, { skipSerialization: true });
  } catch (error) {
    console.error("Artist availability GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "artist") {
      return errorResponse("Unauthorized", 401);
    }

    const artist = await prisma.artist.findFirst({
      where: { userId: BigInt(user.userId), deletedAt: null },
    });
    if (!artist) return errorResponse("Artist profile not found", 404);

    const body = await request.json();
    const { slots } = body;

    if (!Array.isArray(slots) || slots.length === 0) {
      return errorResponse("At least one slot is required", 400);
    }
    
    if (slots.length > 100) {
      return errorResponse("一度に登録できる枠は100件までです", 400);
    }

    const normalized: Array<{
      date: Date;
      startTime: Date;
      endTime: Date;
    }> = [];

    for (const s of slots as Array<{
      date: string;
      startTime: string;
      endTime: string;
    }>) {
      if (!s?.date || !s?.startTime || !s?.endTime) {
        return errorResponse("各枠に date, startTime, endTime が必要です", 400);
      }
      const shape = validateHourlySlotShape(s.startTime, s.endTime);
      if (!shape.ok) {
        return errorResponse(shape.message, 400);
      }
      const d = new Date(s.date);
      if (Number.isNaN(d.getTime())) {
        return errorResponse("無効な日付です", 400);
      }
      normalized.push({
        date: d,
        startTime: prismaTimeFromHm(shape.start),
        endTime: prismaTimeFromHm(shape.end),
      });
    }

    const created = await prisma.availability.createMany({
      data: normalized.map((row: any) => ({
        artistId: artist.id,
        date: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        status: "AVAILABLE" as const,
      })),
      skipDuplicates: true,
    });

    return successResponse(
      {
        count: created.count,
        requested: slots.length,
        skipped: slots.length - created.count,
      },
      201,
    );
  } catch (error) {
    console.error("Artist availability POST error:", error);
    return errorResponse("Internal server error", 500);
  }
}
