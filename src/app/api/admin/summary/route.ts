import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const [
      artists,
      cases,
      blogs,
      bookings,
      pendingCases,
      pendingBookings,
    ] = await Promise.all([
      prisma.artist.count({ where: { deletedAt: null } }),
      prisma.case.count({ where: { deletedAt: null } }),
      prisma.blog.count(),
      prisma.booking.count(),
      prisma.case.count({
        where: { deletedAt: null, isPublished: false },
      }),
      prisma.booking.count({ where: { status: "PENDING" } }),
    ]);

    return successResponse({
      artists,
      cases,
      blogs,
      bookings,
      pendingCases,
      pendingBookings,
    });
  } catch (error) {
    console.error("Admin summary GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}
