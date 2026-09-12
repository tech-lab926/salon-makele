import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "artist") {
      return errorResponse("Unauthorized", 401);
    }

    const artist = await prisma.artist.findFirst({
      where: { userId: BigInt(user.userId), deletedAt: null },
    });
    if (!artist) return errorResponse("Artist profile not found", 404);

    const menus = await prisma.menu.findMany({
      where: { artistId: artist.id },
      orderBy: { sortOrder: "asc" },
      include: { category: true },
    });

    const serialized = menus.map((m: any) => ({
      id: m.id.toString(),
      name: m.name,
      description: m.description,
      price: m.price,
      durationMin: m.durationMin,
      isActive: m.isActive,
      categoryId: m.categoryId.toString(),
      categoryName: m.category.name,
    }));

    return successResponse(serialized);
  } catch (error) {
    console.error("Artist menus GET error:", error);
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
    const { name, description, price, durationMin, categoryId } = body;

    if (!name) {
      return errorResponse("Name is required", 400);
    }
    if (!categoryId || !/^\d+$/.test(String(categoryId))) {
      return errorResponse("Valid category ID is required", 400);
    }

    // Validate that the category is in the artist's supported skills
    const artistSkill = await prisma.artistSkill.findFirst({
      where: { artistId: artist.id, categoryId: BigInt(categoryId) },
    });
    if (!artistSkill) {
      return errorResponse("このカテゴリはあなたの対応カテゴリに含まれていません", 403);
    }

    const trimmedName = typeof name === "string" ? name.trim().slice(0, 100) : "";
    if (!trimmedName) return errorResponse("Name is required", 400);

    const parsedPrice = price != null ? Number(price) : null;
    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0 || parsedPrice > 1_000_000)) {
      return errorResponse("Price must be between 0 and 1,000,000", 400);
    }

    const parsedDuration = durationMin ? Number(durationMin) : 60;
    if (!Number.isInteger(parsedDuration) || parsedDuration < 15 || parsedDuration > 480 || parsedDuration % 15 !== 0) {
      return errorResponse("Duration must be a multiple of 15 minutes, between 15 and 480", 400);
    }

    const menu = await prisma.menu.create({
      data: {
        artistId: artist.id,
        categoryId: BigInt(categoryId),
        name: trimmedName,
        description: description ? String(description).trim().slice(0, 500) : null,
        price: parsedPrice,
        durationMin: parsedDuration,
      },
    });

    return successResponse({ id: menu.id.toString() }, 201);
  } catch (error) {
    console.error("Artist menu POST error:", error);
    return errorResponse("Internal server error", 500);
  }
}
