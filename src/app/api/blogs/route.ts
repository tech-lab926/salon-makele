import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { paginatedResponse, errorResponse } from "@/lib/api-response";
import { getPageRange } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/constants";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || ITEMS_PER_PAGE);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {
      isPublished: true,
      publishedAt: { not: null },
    };

    if (category) {
      where.categories = {
        some: { category: { slug: category } },
      };
    }

    const { skip, take } = getPageRange(page, limit);

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          thumbnailUrl: true,
          publishedAt: true,
          author: { select: { name: true } },
          categories: { include: { category: true } },
        },
      }),
      prisma.blog.count({ where }),
    ]);

    const serialized = blogs.map((b: any) => ({
      id: b.id.toString(),
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt?.trim() || null,
      thumbnailUrl: b.thumbnailUrl,
      publishedAt: b.publishedAt?.toISOString() || null,
      author: b.author.name,
      categories: b.categories.map((bc: any) => ({
        id: bc.category.id.toString(),
        name: bc.category.name,
        slug: bc.category.slug,
      })),
    }));

    return paginatedResponse(serialized, Number(total), page, limit, {
      cacheSeconds: 60,
    });
  } catch (error) {
    console.error("Blogs list error:", error);
    return errorResponse("Internal server error", 500);
  }
}
