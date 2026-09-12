import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

const baseUrl = () => getSiteUrl();

/** Per-type cap (recent `updatedAt` first if truncated); keeps generation bounded at scale. */
const SITEMAP_MAX_CASES = 12_500;
const SITEMAP_MAX_ARTISTS = 12_500;
const SITEMAP_MAX_BLOGS = 8_000;

/** Regenerate sitemap periodically instead of hitting DB on every request. */
export const revalidate = 3600;

// Simple in-process cache to avoid DB hits for the revalidate window.
const globalSitemapCache = globalThis as unknown as {
  __sitemap?: { ts: number; data: MetadataRoute.Sitemap };
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const root = baseUrl();

  const now = Date.now();
  const cache = globalSitemapCache.__sitemap;
  if (cache && now - cache.ts < revalidate * 1000) {
    return cache.data;
  }

  let cases: { id: bigint; updatedAt: Date }[] = [];
  let artists: { id: bigint; updatedAt: Date }[] = [];
  let blogs: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string }[] = [];

  try {
    [cases, artists, blogs, categories] = await Promise.all([
      prisma.case.findMany({
        where: { isPublished: true, deletedAt: null },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: SITEMAP_MAX_CASES,
      }),
      prisma.artist.findMany({
        where: { isPublished: true, deletedAt: null },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: SITEMAP_MAX_ARTISTS,
      }),
      prisma.blog.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: SITEMAP_MAX_BLOGS,
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true },
      }),
    ]);
  } catch (err) {
    // DB unavailable — fall back to static pages only
    console.error("sitemap generation error:", err);
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: root, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${root}/cases`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${root}/artists`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${root}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${root}/search`, changeFrequency: "weekly", priority: 0.5 },
  ];

  const casePages: MetadataRoute.Sitemap = cases.map((c: any) => ({
    url: `${root}/cases/${c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const artistPages: MetadataRoute.Sitemap = artists.map((a: any) => ({
    url: `${root}/artists/${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogPages: MetadataRoute.Sitemap = blogs.map((b: any) => ({
    url: `${root}/blog/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((c: any) => ({
    url: `${root}/categories/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const final = [...staticPages, ...casePages, ...artistPages, ...blogPages, ...categoryPages];
  globalSitemapCache.__sitemap = { ts: Date.now(), data: final };
  return final;
}
