import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "artist") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    if (!/^\d+$/.test(id)) return errorResponse("Invalid slot ID", 400);
    const artist = await prisma.artist.findFirst({
      where: { userId: BigInt(user.userId), deletedAt: null },
    });
    if (!artist) return errorResponse("Artist profile not found", 404);

    const slot = await prisma.availability.findFirst({
      where: { id: BigInt(id), artistId: artist.id },
    });
    if (!slot) return errorResponse("Slot not found", 404);

    if (slot.status === "BOOKED") {
      return errorResponse("Cannot delete a booked slot", 400);
    }

    await prisma.availability.delete({ where: { id: slot.id } });

    return successResponse({ message: "Slot deleted" });
  } catch (error) {
    console.error("Artist availability DELETE error:", error);
    return errorResponse("Internal server error", 500);
  }
}
