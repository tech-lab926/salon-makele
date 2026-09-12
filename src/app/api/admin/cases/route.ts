import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { notifyArtistCaseFirstPublished } from "@/lib/case-publish-notify";
import { getPageRange } from "@/lib/utils";
import { ADMIN_ITEMS_PER_PAGE } from "@/constants";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || ADMIN_ITEMS_PER_PAGE),
    );
    const { skip, take } = getPageRange(page, limit);

    const published = searchParams.get("published");
    const where: { deletedAt: null; isPublished?: boolean } = { deletedAt: null };
    if (published === "true") where.isPublished = true;
    if (published === "false") where.isPublished = false;

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          artist: { select: { displayName: true } },
          category: { select: { name: true } },
          technique: { select: { name: true } },
        },
      }),
      prisma.case.count({ where }),
    ]);

    const serialized = cases.map((c: any) => ({
      id: c.id.toString(),
      title: c.title || "Untitled",
      artistName: c.artist?.displayName || "Unknown Artist",
      categoryName: c.category?.name || "Uncategorized",
      techniqueName: c.technique?.name || null,
      isPublished: !!c.isPublished,
      viewCount: Number(c.viewCount || 0),
      createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
    }));

    return paginatedResponse(serialized, Number(total), page, limit, { skipSerialization: true });
  } catch (error) {
    console.error("Admin cases GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { id, isPublished } = body;

    if (!id || !/^\d+$/.test(id)) return errorResponse("Invalid case ID", 400);
    const caseId = BigInt(id);
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

    const nextPublished = Boolean(isPublished);
    await prisma.case.update({
      where: { id: caseId },
      data: { isPublished: nextPublished },
    });

    if (!existing.isPublished && nextPublished) {
      await notifyArtistCaseFirstPublished({
        caseId: existing.id,
        caseTitle: existing.title,
        artistUserId: existing.artist.userId,
        artistEmail: existing.artist.user.email,
        artistDisplayName: existing.artist.displayName,
      });
    }

    return successResponse({ message: "Case updated" });
  } catch (error) {
    console.error("Admin cases PATCH error:", error);
    return errorResponse("Internal server error", 500);
  }
}
