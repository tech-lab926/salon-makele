import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, paginatedResponse } from "@/lib/api-response";
import { getPageRange } from "@/lib/utils";
import { ADMIN_ITEMS_PER_PAGE } from "@/constants";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || ADMIN_ITEMS_PER_PAGE),
    );
    const { skip, take } = getPageRange(page, limit);

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          user: { select: { name: true, email: true } },
          artist: { select: { displayName: true } },
          menu: { select: { name: true, price: true, durationMin: true } },
          availability: { select: { date: true, startTime: true, endTime: true } },
        },
      }),
      prisma.booking.count(),
    ]);

    const serialized = bookings.map((b: any) => ({
      id: b.id.toString(),
      status: b.status,
      user: { 
        name: b.user?.name || "Unknown", 
        email: b.user?.email || "" 
      },
      artist: b.artist?.displayName || "Unknown Artist",
      menu: b.menu ? { name: b.menu.name, price: b.menu.price, durationMin: b.menu.durationMin } : null,
      date: b.availability?.date ? b.availability.date.toISOString().split("T")[0] : "",
      startTime: b.availability?.startTime ? b.availability.startTime.toISOString().slice(11, 16) : "",
      endTime: b.availability?.startTime && b.menu?.durationMin
        ? new Date(b.availability.startTime.getTime() + b.menu.durationMin * 60000).toISOString().slice(11, 16)
        : b.availability?.endTime ? b.availability.endTime.toISOString().slice(11, 16) : "",
      createdAt: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString(),
    }));

    return paginatedResponse(serialized, Number(total), page, limit);
  } catch (error) {
    console.error("Admin bookings GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}
