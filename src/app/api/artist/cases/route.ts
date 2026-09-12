import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { getPageRange } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "artist") {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const { skip, take } = getPageRange(page, limit);

    if (!/^\d+$/.test(user.userId)) {
      return errorResponse("Invalid user ID", 401);
    }
    const userId = user.userId;

    const artist = await prisma.artist.findFirst({
      where: { userId: BigInt(userId), deletedAt: null },
    });
    if (!artist) return errorResponse("Artist profile not found", 404);

    const where = { artistId: artist.id, deletedAt: null };
    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { category: true, technique: true },
      }),
      prisma.case.count({ where }),
    ]);

    const serialized = cases.map((c: any) => ({
      id: c.id.toString(),
      title: c.title,
      categoryName: c.category.name,
      techniqueName: c.technique?.name || null,
      menuId: c.menuId?.toString() || null,
      isPublished: c.isPublished,
      viewCount: Number(c.viewCount),
      createdAt: c.createdAt.toISOString(),
    }));

    return paginatedResponse(serialized, Number(total), page, limit, { skipSerialization: true });
  } catch (error) {
    console.error("Artist cases GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      title,
      description,
      categoryId,
      techniqueId,
      menuId,
      beforeImgUrl,
      afterImgUrl,
      sessionCount,
      downtimeDays,
      downtimeNote,
    } = body;

    if (!title || !description || !categoryId || !beforeImgUrl || !afterImgUrl) {
      return errorResponse("Required fields missing", 400);
    }

    if (description.length < 300 || description.length > 500) {
      return errorResponse("説明文は300〜500文字で入力してください", 400);
    }

    if (!categoryId || !/^\d+$/.test(String(categoryId))) {
      return errorResponse("Valid category ID is required", 400);
    }
    const validatedCategoryId = BigInt(categoryId);

    // Validate that the category is in the artist's supported skills
    const artistSkill = await prisma.artistSkill.findFirst({
      where: { artistId: artist.id, categoryId: validatedCategoryId },
    });
    if (!artistSkill) {
      return errorResponse("このカテゴリはあなたの対応カテゴリに含まれていません", 403);
    }

    const validatedTechniqueId = (techniqueId && /^\d+$/.test(String(techniqueId))) ? BigInt(techniqueId) : null;
    const validatedMenuId = (menuId && /^\d+$/.test(String(menuId))) ? BigInt(menuId) : null;

    const newCase = await prisma.case.create({
      data: {
        artistId: artist.id,
        categoryId: validatedCategoryId,
        techniqueId: validatedTechniqueId,
        menuId: validatedMenuId,
        title,
        description,
        beforeImgUrl,
        afterImgUrl,
        sessionCount: sessionCount ? Number(sessionCount) : null,
        downtimeDays: downtimeDays ? Number(downtimeDays) : null,
        downtimeNote: downtimeNote || null,
        isPublished: false,
      },
    });

    return successResponse({ id: newCase.id.toString() }, 201);
  } catch (error) {
    console.error("Artist case POST error:", error);
    return errorResponse("Internal server error", 500);
  }
}
