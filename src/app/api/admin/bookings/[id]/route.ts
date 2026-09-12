import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    if (!/^\d+$/.test(id)) return errorResponse("Invalid booking ID", 400);

    const booking = await prisma.booking.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: { select: { id: true, name: true, email: true } },
        artist: { select: { id: true, displayName: true } },
        menu: { select: { id: true, name: true, price: true, durationMin: true } },
        availability: { select: { date: true, startTime: true, endTime: true } },
        fee: true,
        review: true,
      },
    });

    if (!booking) {
      return errorResponse("Booking not found", 404);
    }

    const serialized = {
      id: booking.id.toString(),
      status: booking.status,
      userNote: booking.userNote,
      artistNote: booking.artistNote,
      cancelledBy: booking.cancelledBy,
      cancelledAt: booking.cancelledAt ? booking.cancelledAt.toISOString() : null,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      stripePaymentIntentId: booking.stripePaymentIntentId,
      user: booking.user ? {
        id: booking.user.id.toString(),
        name: booking.user.name,
        email: booking.user.email,
      } : null,
      artist: booking.artist ? {
        id: booking.artist.id.toString(),
        displayName: booking.artist.displayName,
      } : null,
      menu: booking.menu ? {
        id: booking.menu.id.toString(),
        name: booking.menu.name,
        price: booking.menu.price,
        durationMin: booking.menu.durationMin,
      } : null,
      date: booking.availability?.date ? booking.availability.date.toISOString().split("T")[0] : "",
      startTime: booking.availability?.startTime ? booking.availability.startTime.toISOString().slice(11, 16) : "",
      endTime: booking.availability?.startTime && booking.menu?.durationMin
        ? new Date(booking.availability.startTime.getTime() + booking.menu.durationMin * 60000).toISOString().slice(11, 16)
        : booking.availability?.endTime ? booking.availability.endTime.toISOString().slice(11, 16) : "",
      fee: booking.fee ? {
        id: booking.fee.id.toString(),
        status: booking.fee.status,
        feeAmount: booking.fee.feeAmount,
      } : null,
      review: booking.review ? {
        id: booking.review.id.toString(),
        rating: booking.review.rating,
        comment: booking.review.comment,
      } : null,
    };

    return successResponse(serialized);
  } catch (error) {
    console.error("Admin booking detail GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}
