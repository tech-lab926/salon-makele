import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "artist") {
      return errorResponse("Unauthorized", 401);
    }

    if (!/^\d+$/.test(user.userId)) {
      return errorResponse("Invalid user ID", 401);
    }
    const userId = user.userId;

    const artist = await prisma.artist.findFirst({
      where: { userId: BigInt(userId), deletedAt: null },
    });
    if (!artist) return errorResponse("Artist profile not found", 404);

    const [caseCount, menuCount, pendingBookings, totalBookings] = await Promise.all([
      prisma.case.count({ where: { artistId: artist.id, deletedAt: null } }),
      prisma.menu.count({ where: { artistId: artist.id } }),
      prisma.booking.count({
        where: { artistId: artist.id, status: "PENDING" },
      }),
      prisma.booking.count({ where: { artistId: artist.id } }),
    ]);

    return successResponse({
      cases: caseCount,
      menus: menuCount,
      pendingBookings,
      totalBookings,
    });
  } catch (error) {
    console.error("Artist summary GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}
