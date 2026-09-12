import { getAuthUser } from "@/lib/auth";
import { prisma, isMockPrisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { id } = await req.json();
    if (!id) return errorResponse("Missing id", 400);

    if (isMockPrisma) {
      // In our mock prisma, we'll just update the dbData directly
      // since 'update' might not be fully implemented in the proxy handler
      const bookings = (prisma as unknown as { _dbData: { bookings: { id: { toString(): string }; userId: { toString(): string }; status: string }[] } })._dbData.bookings;
      const booking = bookings.find((b: { id: { toString(): string }; userId: { toString(): string } }) => b.id.toString() === id.toString() && b.userId.toString() === user.userId.toString());

      if (!booking) return errorResponse("Booking not found", 404);

      booking.status = "CANCELLED";

      return successResponse({ success: true });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: BigInt(String(id)), userId: BigInt(user.userId) },
      select: { id: true, availabilityId: true, status: true },
    });

    if (!booking) return errorResponse("Booking not found", 404);

    if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
      return errorResponse("この予約はキャンセルできません", 400);
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED", cancelledBy: "user", cancelledAt: new Date() },
      });
      await tx.availability.update({
        where: { id: booking.availabilityId },
        data: { status: "AVAILABLE", version: { increment: 1 } },
      });
      // Also restore any overflow slots blocked for multi-hour menus.
      await tx.availability.updateMany({
        where: { blockedByBookingId: booking.id },
        data: { status: "AVAILABLE", blockedByBookingId: null, version: { increment: 1 } },
      });
    });

    return successResponse({ success: true });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return errorResponse("Internal server error", 500);
  }
}
