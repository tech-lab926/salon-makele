import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { artistPopularOrderBy, casePopularOrderBy } from "@/lib/list-order";
import { paginatedResponse, errorResponse } from "@/lib/api-response";
import { getPageRange } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/constants";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limitCheck = checkRateLimit(`search:${ip}`, 30, 60_000);
    if (!limitCheck.ok) {
      return errorResponse("検索回数が上限に達しました。しばらく待ってから再度お試しください。", 429);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || ITEMS_PER_PAGE);
    const categorySlug = searchParams.get("category");
    const areaId = searchParams.get("areaId");
    const rawKeyword = searchParams.get("q");
    // Cap keyword length: unbounded ILIKE patterns cause PostgreSQL full-scan CPU spikes.
    const keyword = rawKeyword ? rawKeyword.slice(0, 100) : null;
    const type = searchParams.get("type") || "cases";

    const { skip, take } = getPageRange(page, limit);

    if (type === "artists") {
      const where: Record<string, unknown> = {
        isPublished: true,
        deletedAt: null,
      };

      if (areaId && /^\d+$/.test(areaId)) where.areaId = BigInt(areaId);
      if (categorySlug) {
        where.skills = { some: { category: { slug: categorySlug } } };
      }
      if (keyword) {
        where.displayName = { contains: keyword, mode: "insensitive" };
      }

      const [artists, total] = await Promise.all([
        prisma.artist.findMany({
          where,
          orderBy: artistPopularOrderBy,
          skip,
          take,
          include: {
            area: true,
            skills: {
              orderBy: { sortOrder: "asc" },
              take: 12,
              include: { category: true },
            },
          },
        }),
        prisma.artist.count({ where }),
      ]);

      const serialized = artists.map((a: any) => ({
        id: a.id.toString(),
        displayName: a.displayName,
        profileImgUrl: a.profileImgUrl,
        clinicName: a.clinicName,
        area: { prefecture: a.area.prefecture, city: a.area.city },
        skills: a.skills.map((s: any) => ({ name: s.category.name, slug: s.category.slug })),
      }));

      return paginatedResponse(serialized, Number(total), page, limit, {
        cacheSeconds: 60,
      });
    }

    const where: Record<string, unknown> = {
      isPublished: true,
      deletedAt: null,
      artist: {
        isPublished: true,
        deletedAt: null,
      },
    };

    if (categorySlug) where.category = { slug: categorySlug };
    if (areaId && /^\d+$/.test(areaId)) {
      where.artist = { ...where.artist as any, areaId: BigInt(areaId) };
    }
    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: "insensitive" } },
        { description: { contains: keyword, mode: "insensitive" } },
      ];
    }

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        orderBy: casePopularOrderBy,
        skip,
        take,
        select: {
          id: true,
          title: true,
          beforeImgUrl: true,
          afterImgUrl: true,
          artist: { select: { id: true, displayName: true, profileImgUrl: true } },
          category: { select: { name: true, slug: true } },
          technique: { select: { name: true } },
        },
      }),
      prisma.case.count({ where }),
    ]);

    const serialized = cases.map((c: any) => ({
      id: c.id.toString(),
      title: c.title,
      beforeImgUrl: c.beforeImgUrl,
      afterImgUrl: c.afterImgUrl,
      artist: { 
        id: c.artist.id.toString(), 
        displayName: c.artist.displayName,
        profileImgUrl: c.artist.profileImgUrl 
      },
      category: { name: c.category.name, slug: c.category.slug },
      technique: c.technique ? { name: c.technique.name } : null,
    }));

    return paginatedResponse(serialized, Number(total), page, limit, {
      cacheSeconds: 60,
    });
  } catch (error) {
    console.error("Search error:", error);
    return errorResponse("Internal server error", 500);
  }
}
