import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sanitizeBlogHtml } from "@/lib/sanitize-blog";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const blog = await prisma.blog.findFirst({
      where: { slug, isPublished: true },
      include: {
        author: { select: { name: true } },
        categories: { include: { category: true } },
      },
    });

    if (!blog) {
      return errorResponse("Blog not found", 404);
    }

    const serialized = {
      id: blog.id.toString(),
      title: blog.title,
      slug: blog.slug,
      body: sanitizeBlogHtml(blog.body),
      thumbnailUrl: blog.thumbnailUrl,
      publishedAt: blog.publishedAt?.toISOString() || null,
      createdAt: blog.createdAt.toISOString(),
      author: blog.author.name,
      categories: blog.categories.map((bc: any) => ({
        id: bc.category.id.toString(),
        name: bc.category.name,
        slug: bc.category.slug,
      })),
    };

    return successResponse(serialized);
  } catch (error) {
    console.error("Blog detail error:", error);
    return errorResponse("Internal server error", 500);
  }
}
