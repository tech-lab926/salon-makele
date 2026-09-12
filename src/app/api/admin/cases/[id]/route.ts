import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { notifyArtistCaseFirstPublished } from "@/lib/case-publish-notify";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    if (!/^\d+$/.test(id)) return errorResponse("Invalid case ID", 400);
    const c = await prisma.case.findUnique({
      where: { id: BigInt(id) },
      include: {
        artist: { select: { id: true, displayName: true } },
        category: { select: { id: true, name: true } },
        technique: { select: { id: true, name: true } },
      },
    });

    if (!c) return errorResponse("Case not found", 404);

    return successResponse({
      id: c.id.toString(),
      artistId: c.artistId.toString(),
      title: c.title,
      description: c.description,
      categoryId: c.categoryId.toString(),
      techniqueId: c.techniqueId?.toString() || "",
      beforeImgUrl: c.beforeImgUrl,
      afterImgUrl: c.afterImgUrl,
      sessionCount: c.sessionCount,
      downtimeDays: c.downtimeDays,
      downtimeNote: c.downtimeNote,
      isPublished: c.isPublished,
      isSponsored: c.isSponsored,
      priorityRank: c.priorityRank,
      viewCount: c.viewCount,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      artist: c.artist ? { id: c.artist.id.toString(), displayName: c.artist.displayName } : null,
      category: c.category ? { id: c.category.id.toString(), name: c.category.name } : null,
      technique: c.technique ? { id: c.technique.id.toString(), name: c.technique.name } : null,
    });
  } catch (error) {
    console.error("Admin case GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    if (!/^\d+$/.test(id)) return errorResponse("Invalid case ID", 400);
    const caseId = BigInt(id);
    const body = await request.json();

    const existing = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        artist: {
          select: {
            userId: true,
            displayName: true,
            user: { select: { email: true } },
          },
        },
      },
    });
    if (!existing) return errorResponse("Case not found", 404);

    if (body.description !== undefined) {
      const desc = String(body.description);
      if (desc.length < 300 || desc.length > 500) {
        return errorResponse("説明文は300〜500文字で入力してください", 400);
      }
    }

    const nextPublished =
      body.isPublished !== undefined ? Boolean(body.isPublished) : existing.isPublished;
    const nextTitle =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : existing.title;

    await prisma.case.update({
      where: { id: caseId },
      data: {
        title: body.title || undefined,
        description: body.description || undefined,
        categoryId: (body.categoryId && /^\d+$/.test(String(body.categoryId))) ? BigInt(body.categoryId) : undefined,
        techniqueId: body.techniqueId !== undefined
          ? (body.techniqueId && /^\d+$/.test(String(body.techniqueId))) ? BigInt(body.techniqueId) : null
          : undefined,
        beforeImgUrl: body.beforeImgUrl || undefined,
        afterImgUrl: body.afterImgUrl || undefined,
        sessionCount: body.sessionCount !== undefined ? body.sessionCount : undefined,
        downtimeDays: body.downtimeDays !== undefined ? body.downtimeDays : undefined,
        downtimeNote: body.downtimeNote !== undefined ? body.downtimeNote : undefined,
        isPublished: body.isPublished !== undefined ? body.isPublished : undefined,
        isSponsored: body.isSponsored !== undefined ? Boolean(body.isSponsored) : undefined,
        priorityRank: body.priorityRank !== undefined ? Number(body.priorityRank) : undefined,
      },
    });

    if (!existing.isPublished && nextPublished && existing.artist.isPublished) {
      await notifyArtistCaseFirstPublished({
        caseId: existing.id,
        caseTitle: nextTitle,
        artistUserId: existing.artist.userId,
        artistEmail: existing.artist.user.email,
        artistDisplayName: existing.artist.displayName,
      });
    }

    (revalidateTag as any)("catalog-published-cases");
    return successResponse({ message: "Case updated" });
  } catch (error) {
    console.error("Admin case PUT error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    if (!/^\d+$/.test(id)) return errorResponse("Invalid case ID", 400);
    const caseId = BigInt(id);
    const existing = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existing) {
      return errorResponse("Case not found", 404);
    }

    await prisma.case.update({
      where: { id: caseId },
      data: { deletedAt: new Date() },
    });

    (revalidateTag as any)("catalog-published-cases");
    return successResponse({ message: "Case deleted" });
  } catch (error) {
    console.error("Admin case DELETE error:", error);
    return errorResponse("Internal server error", 500);
  }
}
