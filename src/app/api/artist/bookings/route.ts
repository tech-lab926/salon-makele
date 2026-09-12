import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, paginatedResponse } from "@/lib/api-response";
import { getPageRange } from "@/lib/utils";

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
    const status = searchParams.get("status");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || 50),
    );
    const { skip, take } = getPageRange(page, limit);

    const where: Record<string, unknown> = { artistId: artist.id };
    if (status) where.status = status.toUpperCase();

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          user: { select: { name: true, email: true } },
          menu: { select: { name: true, price: true, durationMin: true } },
          availability: { select: { date: true, startTime: true, endTime: true } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const serialized = bookings.map((b: any) => ({
      id: b.id.toString(),
      status: b.status,
      userNote: b.userNote,
      artistNote: b.artistNote,
      user: { 
        name: b.user?.name || "Guest", 
        email: b.user?.email || "" 
      },
      menu: b.menu
        ? { name: b.menu.name, price: b.menu.price, durationMin: b.menu.durationMin }
        : null,
      date: b.availability?.date ? b.availability.date.toISOString().split("T")[0] : "",
      startTime: b.availability?.startTime ? b.availability.startTime.toISOString().slice(11, 16) : "",
      endTime: b.availability?.startTime && b.menu?.durationMin
        ? new Date(b.availability.startTime.getTime() + b.menu.durationMin * 60000).toISOString().slice(11, 16)
        : b.availability?.endTime 
          ? b.availability.endTime.toISOString().slice(11, 16) 
          : "",
      createdAt: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString(),
    }));

    return paginatedResponse(serialized, Number(total), page, limit, { skipSerialization: true });
  } catch (error) {
    console.error("Artist bookings GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}
