import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { casePopularOrderBy } from "@/lib/list-order";
import { paginatedResponse, errorResponse } from "@/lib/api-response";
import { getPageRange } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/constants";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || ITEMS_PER_PAGE);
    const categoryId = searchParams.get("categoryId");
    const category = searchParams.get("category");
    const areaId = searchParams.get("areaId");
    const rawKeyword = searchParams.get("q");
    // Cap keyword length: unbounded ILIKE patterns cause PostgreSQL full-scan CPU spikes.
    const keyword = rawKeyword ? rawKeyword.slice(0, 100) : null;
    const artistId = searchParams.get("artistId");
    const sort = searchParams.get("sort") || "newest";

    const where: Record<string, any> = {
      isPublished: true,
      deletedAt: null,
      artist: {
        isPublished: true,
        deletedAt: null,
      },
    };

    if (categoryId) where.categoryId = BigInt(categoryId);
    if (category) where.category = { slug: category };
    if (areaId) {
      // Merge areaId into the existing artist filter without overwriting it
      where.artist = { ...where.artist, areaId: BigInt(areaId) };
    }
    if (artistId) where.artistId = BigInt(artistId);
    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
      ];
    }

    const orderBy =
      sort === "popular" ? casePopularOrderBy : { createdAt: "desc" as const };

    const { skip, take } = getPageRange(page, limit);

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          title: true,
          beforeImgUrl: true,
          afterImgUrl: true,
          sessionCount: true,
          downtimeDays: true,
          downtimeNote: true,
          viewCount: true,
          createdAt: true,
          artist: { select: { id: true, displayName: true, profileImgUrl: true } },
          category: true,
          technique: true,
        },
      }),
      prisma.case.count({ where }),
    ]);

    const serialized = cases.map((c: any) => ({
      id: c.id.toString(),
      title: c.title,
      beforeImgUrl: c.beforeImgUrl,
      afterImgUrl: c.afterImgUrl,
      sessionCount: c.sessionCount,
      downtimeDays: c.downtimeDays,
      downtimeNote: c.downtimeNote,
      viewCount: Number(c.viewCount),
      createdAt: c.createdAt.toISOString(),
      artist: {
        id: c.artist.id.toString(),
        displayName: c.artist.displayName,
        profileImgUrl: c.artist.profileImgUrl,
      },
      category: { id: c.category.id.toString(), name: c.category.name, slug: c.category.slug },
      technique: c.technique
        ? { id: c.technique.id.toString(), name: c.technique.name }
        : null,
    }));

    return paginatedResponse(serialized, Number(total), page, limit, {
      cacheSeconds: 60,
    });
  } catch (error) {
    console.error("Cases list error:", error);
    return errorResponse("Internal server error", 500);
  }
}
