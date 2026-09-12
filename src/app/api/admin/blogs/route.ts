import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { slugify, getPageRange } from "@/lib/utils";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { sanitizeBlogHtml } from "@/lib/sanitize-blog";
import { excerptFromHtml } from "@/lib/blog-excerpt";
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

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          author: { select: { name: true } },
          categories: { include: { category: { select: { name: true } } } },
        },
      }),
      prisma.blog.count(),
    ]);

    const serialized = blogs.map((b: any) => ({
      id: b.id.toString(),
      title: b.title,
      slug: b.slug,
      isPublished: b.isPublished,
      publishedAt: b.publishedAt?.toISOString() || null,
      author: b.author.name,
      categories: b.categories.map((bc: any) => bc.category.name),
      createdAt: b.createdAt.toISOString(),
    }));

    return paginatedResponse(serialized, Number(total), page, limit);
  } catch (error) {
    console.error("Admin blogs GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { title, slug: slugIn, body: blogBody, excerpt: excerptIn, categoryIds, isPublished, thumbnailUrl } =
      body;

    if (!title || !blogBody) {
      return errorResponse("Title and body are required", 400);
    }

    const trimmedTitle = String(title).trim().slice(0, 200);
    if (!trimmedTitle) return errorResponse("Title is required", 400);

    const safeBody = sanitizeBlogHtml(String(blogBody));
    const excerpt =
      excerptIn != null && String(excerptIn).trim()
        ? String(excerptIn).trim().slice(0, 400)
        : excerptFromHtml(safeBody, 400);

    let slug = slugIn ? String(slugIn).trim() : slugify(title);
    if (!slug) slug = `blog-${Date.now()}`;
    const existing = await prisma.blog.findFirst({ where: { slug } });
    if (existing) {
      if (slugIn) return errorResponse("このパーマリンク（スラッグ）は既に使用されています", 400);
      slug = `${slug}-${Date.now()}`;
    }

    const validCategoryIds = Array.isArray(categoryIds)
      ? categoryIds.filter((cid: string) => /^\d+$/.test(String(cid))).map((cid: string) => BigInt(cid))
      : [];

    const blog = await prisma.blog.create({
      data: {
        authorId: BigInt(user.userId),
        title,
        slug,
        body: safeBody,
        excerpt,
        thumbnailUrl: thumbnailUrl || null,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
        categories: {
          create: validCategoryIds.map((cid: bigint) => ({
            categoryId: cid,
          })),
        },
      },
    });

    return successResponse({ id: blog.id.toString(), slug: blog.slug }, 201);
  } catch (error) {
    console.error("Admin blog POST error:", error);
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

    if (!id || !/^\d+$/.test(String(id))) return errorResponse("Valid Blog ID is required", 400);

    const data: Record<string, unknown> = { isPublished };
    if (isPublished) data.publishedAt = new Date();

    await prisma.blog.update({
      where: { id: BigInt(id) },
      data,
    });

    return successResponse({ message: "Blog updated" });
  } catch (error) {
    console.error("Admin blog PATCH error:", error);
    return errorResponse("Internal server error", 500);
  }
}
