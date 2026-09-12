import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { artistPopularOrderBy } from "@/lib/list-order";
import { paginatedResponse, errorResponse } from "@/lib/api-response";
import { getPageRange } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/constants";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || ITEMS_PER_PAGE);
    const areaId = searchParams.get("areaId");
    const categoryId = searchParams.get("categoryId");
    const categorySlug = searchParams.get("category");
    const rawKeyword = searchParams.get("q");
    // Cap keyword length: unbounded ILIKE patterns cause PostgreSQL full-scan CPU spikes.
    const keyword = rawKeyword ? rawKeyword.slice(0, 100) : null;
    const sort = searchParams.get("sort") || "ranking";

    const where: Record<string, any> = {
      isPublished: true,
      deletedAt: null,
    };

    if (areaId) where.areaId = BigInt(areaId);
    if (categoryId) {
      where.skills = { some: { categoryId: BigInt(categoryId) } };
    }
    if (categorySlug) {
      where.skills = { some: { category: { slug: categorySlug } } };
    }
    if (keyword) {
      where.OR = [
        { displayName: { contains: keyword, mode: "insensitive" } },
        { bio: { contains: keyword, mode: "insensitive" } },
      ];
    }

    const orderBy =
      sort === "newest"
        ? { createdAt: "desc" as const }
        : artistPopularOrderBy;

    const { skip, take } = getPageRange(page, limit);

    const [artists, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          area: true,
          skills: {
            orderBy: { sortOrder: "asc" },
            take: 12,
            include: { category: true },
          },
          _count: { select: { cases: true } },
        },
      }),
      prisma.artist.count({ where }),
    ]);

    const serialized = artists.map((a: any) => ({
      id: a.id.toString(),
      displayName: a.displayName,
      bio: a.bio,
      profileImgUrl: a.profileImgUrl,
      clinicName: a.clinicName,
      viewCount: Number(a.viewCount),
      area: { id: a.area.id.toString(), prefecture: a.area.prefecture, city: a.area.city },
      skills: a.skills.map((s: any) => ({
        id: s.category.id.toString(),
        name: s.category.name,
        slug: s.category.slug,
      })),
      caseCount: a._count.cases,
    }));

    return paginatedResponse(serialized, Number(total), page, limit, {
      cacheSeconds: 60,
      skipSerialization: true,
    });
  } catch (error) {
    console.error("Artists list error:", error);
    return errorResponse("Internal server error", 500);
  }
}
