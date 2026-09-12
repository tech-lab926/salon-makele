import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
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

    const caseItem = await prisma.case.findFirst({
      where: { id: BigInt(id), artistId: artist.id, deletedAt: null },
    });
    if (!caseItem) return errorResponse("Case not found", 404);

    return successResponse({
      id: caseItem.id.toString(),
      title: caseItem.title,
      description: caseItem.description,
      categoryId: caseItem.categoryId.toString(),
      techniqueId: caseItem.techniqueId?.toString() || "",
      menuId: caseItem.menuId?.toString() || "",
      beforeImgUrl: caseItem.beforeImgUrl,
      afterImgUrl: caseItem.afterImgUrl,
      sessionCount: caseItem.sessionCount,
      downtimeDays: caseItem.downtimeDays,
      downtimeNote: caseItem.downtimeNote,
    });
  } catch (error) {
    console.error("Artist case GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

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

    const caseItem = await prisma.case.findFirst({
      where: { id: BigInt(id), artistId: artist.id, deletedAt: null },
    });
    if (!caseItem) return errorResponse("Case not found", 404);

    const body = await request.json();

    if (body.description !== undefined) {
      const desc = body.description as string;
      if (desc.length < 300 || desc.length > 500) {
        return errorResponse("説明文は300〜500文字で入力してください", 400);
      }
    }

    // If categoryId is being changed, validate it's in the artist's skills
    if (body.categoryId) {
      const newCategoryId = BigInt(body.categoryId);
      const artistSkill = await prisma.artistSkill.findFirst({
        where: { artistId: artist.id, categoryId: newCategoryId },
      });
      if (!artistSkill) {
        return errorResponse("このカテゴリはあなたの対応カテゴリに含まれていません", 403);
      }
    }

    await prisma.case.update({
      where: { id: caseItem.id },
      data: {
        title: body.title ?? caseItem.title,
        description: body.description ?? caseItem.description,
        categoryId: body.categoryId ? BigInt(body.categoryId) : caseItem.categoryId,
        techniqueId: body.techniqueId !== undefined
          ? body.techniqueId
            ? BigInt(body.techniqueId)
            : null
          : caseItem.techniqueId,
        menuId: body.menuId !== undefined
          ? body.menuId
            ? BigInt(body.menuId)
            : null
          : caseItem.menuId,
        beforeImgUrl: body.beforeImgUrl ?? caseItem.beforeImgUrl,
        afterImgUrl: body.afterImgUrl ?? caseItem.afterImgUrl,
        sessionCount: body.sessionCount !== undefined ? body.sessionCount : caseItem.sessionCount,
        downtimeDays: body.downtimeDays !== undefined ? body.downtimeDays : caseItem.downtimeDays,
        downtimeNote: body.downtimeNote !== undefined ? body.downtimeNote : caseItem.downtimeNote,
      },
    });

    return successResponse({ message: "Case updated" });
  } catch (error) {
    console.error("Artist case PATCH error:", error);
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

    const caseItem = await prisma.case.findFirst({
      where: { id: BigInt(id), artistId: artist.id, deletedAt: null },
    });
    if (!caseItem) return errorResponse("Case not found", 404);

    await prisma.case.update({
      where: { id: caseItem.id },
      data: { deletedAt: new Date() },
    });

    return successResponse({ message: "Case deleted" });
  } catch (error) {
    console.error("Artist case DELETE error:", error);
    return errorResponse("Internal server error", 500);
  }
}
