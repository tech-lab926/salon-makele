import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sanitizeBlogHtml } from "@/lib/sanitize-blog";
import { excerptFromHtml } from "@/lib/blog-excerpt";

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
    if (!/^\d+$/.test(id)) return errorResponse("Invalid blog ID", 400);
    const blog = await prisma.blog.findUnique({
      where: { id: BigInt(id) },
      include: { categories: { include: { category: true } } },
    });

    if (!blog) return errorResponse("Blog not found", 404);

    return successResponse({
      id: blog.id.toString(),
      title: blog.title,
      slug: blog.slug,
      body: blog.body,
      thumbnailUrl: blog.thumbnailUrl,
      isPublished: blog.isPublished,
      categoryIds: blog.categories.map((bc: any) => bc.categoryId.toString()),
    });
  } catch (error) {
    console.error("Admin blog GET error:", error);
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
    if (!/^\d+$/.test(id)) return errorResponse("Invalid blog ID", 400);
    const body = await request.json();
    const { title, slug, body: blogBody, excerpt: excerptIn, thumbnailUrl, isPublished, categoryIds } =
      body;

    if (!title || !blogBody || !slug) {
      return errorResponse("Title, slug, and body are required", 400);
    }

    const safeBody = sanitizeBlogHtml(String(blogBody));
    const excerpt =
      excerptIn != null && String(excerptIn).trim()
        ? String(excerptIn).trim().slice(0, 400)
        : excerptFromHtml(safeBody, 400);

    await prisma.$transaction(async (tx: any) => {
      const data: Record<string, unknown> = {
        title,
        slug,
        body: safeBody,
        excerpt,
        thumbnailUrl: thumbnailUrl || null,
        isPublished: isPublished || false,
      };

      if (isPublished) {
        const existing = await tx.blog.findUnique({ where: { id: BigInt(id) } });
        if (!existing?.publishedAt) data.publishedAt = new Date();
      }

      await tx.blog.update({ where: { id: BigInt(id) }, data });

      await tx.blogCategory.deleteMany({ where: { blogId: BigInt(id) } });

      if (Array.isArray(categoryIds) && categoryIds.length > 0) {
        const validCategoryIds = categoryIds
          .filter((cid: string) => /^\d+$/.test(String(cid)))
          .map((cid: string) => BigInt(cid));

        if (validCategoryIds.length > 0) {
          await tx.blogCategory.createMany({
            data: validCategoryIds.map((cid: bigint) => ({
              blogId: BigInt(id),
              categoryId: cid,
            })),
          });
        }
      }
    });

    return successResponse({ message: "Blog updated" });
  } catch (error) {
    console.error("Admin blog PUT error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    if (!/^\d+$/.test(id)) return errorResponse("Invalid blog ID", 400);

    // Delete related blog categories first if schema doesn't cascade
    await prisma.$transaction(async (tx: any) => {
      await tx.blogCategory.deleteMany({ where: { blogId: BigInt(id) } });
      await tx.blog.delete({ where: { id: BigInt(id) } });
    });

    return successResponse({ message: "Blog deleted" });
  } catch (error) {
    console.error("Admin blog DELETE error:", error);
    return errorResponse("Internal server error", 500);
  }
}
