import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "artist") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const artist = await prisma.artist.findFirst({
      where: { userId: BigInt(user.userId), deletedAt: null },
    });
    if (!artist) return errorResponse("Artist profile not found", 404);

    const menu = await prisma.menu.findFirst({
      where: { id: BigInt(id), artistId: artist.id },
    });
    if (!menu) return errorResponse("Menu not found", 404);

    const body = await request.json();

    // If categoryId is being changed, validate it's in the artist's skills
    if (body.categoryId && /^\d+$/.test(String(body.categoryId))) {
      const artistSkill = await prisma.artistSkill.findFirst({
        where: { artistId: artist.id, categoryId: BigInt(body.categoryId) },
      });
      if (!artistSkill) {
        return errorResponse("このカテゴリはあなたの対応カテゴリに含まれていません", 403);
      }
    }

    const price = body.price !== undefined ? (body.price != null ? Math.max(0, Math.min(1_000_000, Number(body.price))) : null) : menu.price;
    const durationMin = body.durationMin ? Math.max(15, Math.min(480, Number(body.durationMin))) : menu.durationMin;

    await prisma.menu.update({
      where: { id: menu.id },
      data: {
        name: body.name ? String(body.name).trim().slice(0, 100) : menu.name,
        description: body.description !== undefined ? String(body.description || "").trim().slice(0, 1000) : menu.description,
        price,
        durationMin,
        categoryId: (body.categoryId && /^\d+$/.test(String(body.categoryId))) ? BigInt(body.categoryId) : menu.categoryId,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : menu.isActive,
      },
    });

    return successResponse({ message: "Menu updated" });
  } catch (error) {
    console.error("Artist menu PATCH error:", error);
    return errorResponse("Internal server error", 500);
  }
}

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
    const artist = await prisma.artist.findFirst({
      where: { userId: BigInt(user.userId), deletedAt: null },
    });
    if (!artist) return errorResponse("Artist profile not found", 404);

    const menu = await prisma.menu.findFirst({
      where: { id: BigInt(id), artistId: artist.id },
    });
    if (!menu) return errorResponse("Menu not found", 404);

    await prisma.menu.delete({ where: { id: menu.id } });

    return successResponse({ message: "Menu deleted" });
  } catch (error) {
    console.error("Artist menu DELETE error:", error);
    return errorResponse("Internal server error", 500);
  }
}
