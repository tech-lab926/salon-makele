import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { sanitizeBlogHtml } from "@/lib/sanitize-blog";

export const getPublishedBlogBySlug = (slug: string) =>
  unstable_cache(
    async () =>
      prisma.blog.findFirst({
        where: { slug, isPublished: true },
        include: {
          author: { select: { name: true } },
          categories: { include: { category: true } },
        },
      }),
    ["blog-by-slug", slug],
    { revalidate: 60 }
  )();

export type PublishedBlogDetailView = {
  id: string;
  title: string;
  slug: string;
  /** Already sanitized for `dangerouslySetInnerHTML`. */
  body: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  author: string;
  categories: { id: string; name: string; slug: string }[];
};

export const getPublishedBlogDetailForPage = cache(
  async (slug: string): Promise<PublishedBlogDetailView | null> => {
    return unstable_cache(
      async () => {
        const blog = await getPublishedBlogBySlug(slug);
        if (!blog) return null;
        return {
          id: blog.id.toString(),
          title: blog.title,
          slug: blog.slug,
          body: sanitizeBlogHtml(blog.body),
          thumbnailUrl: blog.thumbnailUrl,
          publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString() : null,
          createdAt: new Date(blog.createdAt).toISOString(),
          author: blog.author?.name ?? "MAKELE編集部",
          categories: (blog.categories || []).map((bc: any) => ({
            id: bc.category?.id?.toString() ?? "0",
            name: bc.category?.name ?? "不明",
            slug: bc.category?.slug ?? "unknown",
          })),
        };
      },
      ["blog-detail", slug],
      { revalidate: 60 }
    )();
  },
);

export type BlogSummaryRow = {
  title: string;
  slug: string;
  publishedAt: string | null;
};

export const getRecentBlogSummariesCached = unstable_cache(
  async (): Promise<BlogSummaryRow[]> => {
    const blogs = await prisma.blog.findMany({
      where: { isPublished: true, publishedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      take: 4,
      select: { title: true, slug: true, publishedAt: true },
    });
    return blogs.map((b: any) => ({
      title: b.title,
      slug: b.slug,
      publishedAt: b.publishedAt ? new Date(b.publishedAt).toISOString() : null,
    }));
  },
  ["recent-blog-summaries-v1"],
  { revalidate: 60 },
);
