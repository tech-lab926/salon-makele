import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { ITEMS_PER_PAGE } from "@/constants";
import { getPageRange } from "@/lib/utils";
import { artistPopularOrderBy, casePopularOrderBy } from "@/lib/list-order";

export type CategoryMinimal = { id: string; name: string; slug: string };

/** Cached taxonomy slice — avoids repeated heavy `/api/categories` payloads on RSC renders. */
export const getCategoriesMinimalCached = unstable_cache(
  async (): Promise<CategoryMinimal[]> => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    });
    return categories.map((c: any) => ({
      id: c.id.toString(),
      name: c.name,
      slug: c.slug,
    }));
  },
  ["catalog-categories-minimal-v1"],
  { revalidate: 120 },
);

export type AreaMinimal = {
  id: string;
  prefecture: string;
  city: string | null;
};

export const getAreasMinimalCached = unstable_cache(
  async (): Promise<AreaMinimal[]> => {
    const areas = await prisma.area.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, prefecture: true, city: true },
    });
    return areas.map((a: any) => ({
      id: a.id.toString(),
      prefecture: a.prefecture,
      city: a.city,
    }));
  },
  ["catalog-areas-minimal-v1"],
  { revalidate: 3600 },
);

/** Lightweight slug list for `generateStaticParams` — no techniques joined. */
export async function getActiveCategorySlugParams(): Promise<{ slug: string }[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r: any) => ({ slug: r.slug }));
}

export type CategoryWithTechniques = CategoryMinimal & {
  techniques: { id: string; name: string }[];
};

export const getCategoryBySlugWithTechniques = cache(
  async (slug: string): Promise<CategoryWithTechniques | null> => {
    const cat = await prisma.category.findFirst({
      where: { slug, isActive: true },
      include: {
        techniques: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true },
        },
      },
    });
    if (!cat) return null;
    return {
      id: cat.id.toString(),
      name: cat.name,
      slug: cat.slug,
      techniques: cat.techniques.map((t: any) => ({
        id: t.id.toString(),
        name: t.name,
      })),
    };
  },
);

type CasesPayload<T> = { data: T[]; total: number; totalPages: number };

export const listPublishedCasesPage = unstable_cache(
  async (params: {
    page: number;
    limit: number;
    sort: string;
    category?: string;
    categoryId?: string;
    areaId?: string;
  }): Promise<
    CasesPayload<{
      id: string;
      title: string;
      beforeImgUrl: string | null;
      afterImgUrl: string | null;
      category: { id: string; name: string; slug: string };
      artist: { id: string; displayName: string; profileImgUrl: string | null };
      technique: { id: string; name: string } | null;
      isSponsored: boolean;
    }>
  > => {
  const page = Math.max(1, params.page);
  const limit = Math.min(50, params.limit || ITEMS_PER_PAGE);
  const where: Record<string, unknown> = {
    isPublished: true,
    deletedAt: null,
    artist: {
      isPublished: true,
      deletedAt: null,
    },
  };

  if (params.categoryId) where.categoryId = BigInt(params.categoryId);
  if (params.category) where.category = { slug: params.category };
  if (params.areaId) {
    where.artist = { ...where.artist as object, areaId: BigInt(params.areaId) };
  }
  if ((params as any).techniqueId) {
    where.techniqueId = BigInt((params as any).techniqueId);
  }

  const orderByArray: any[] = [
    { isSponsored: "desc" },
    { priorityRank: "desc" },
  ];
  if (params.sort === "popular") {
    orderByArray.push(...casePopularOrderBy);
  } else {
    orderByArray.push({ createdAt: "desc" });
  }

  const { skip, take } = getPageRange(page, limit);

  const [cases, total] = await Promise.all([
    prisma.case.findMany({
      where,
      orderBy: orderByArray,
      skip,
      take,
      select: {
        id: true,
        title: true,
        beforeImgUrl: true,
        afterImgUrl: true,
        artist: { select: { id: true, displayName: true, profileImgUrl: true } },
        category: true,
        technique: true,
        isSponsored: true,
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
      profileImgUrl: c.artist.profileImgUrl,
    },
    category: {
      id: c.category.id.toString(),
      name: c.category.name,
      slug: c.category.slug,
    },
    technique: c.technique
      ? { id: c.technique.id.toString(), name: c.technique.name }
      : null,
    isSponsored: c.isSponsored,
  }));

  const totalNum = Number(total);
  const totalPages = Math.max(1, Math.ceil(totalNum / limit));

  return { data: serialized, total: totalNum, totalPages };
  },
  ["catalog-published-cases"],
  { revalidate: 60 }
);

export const listPublishedArtistsPage = unstable_cache(
  async (params: {
    page: number;
    limit: number;
    sort: string;
    areaId?: string;
    categoryId?: string;
    categorySlug?: string;
  }): Promise<
    CasesPayload<{
      id: string;
      displayName: string;
      clinicName: string | null;
      profileImgUrl: string | null;
      viewCount: number;
      area: { id: string; prefecture: string; city: string | null };
      skills: { id: string; name: string; slug: string }[];
      caseCount: number;
      isSponsored: boolean;
    }>
  > => {
  const page = Math.max(1, params.page);
  const limit = Math.min(50, params.limit || ITEMS_PER_PAGE);

  const where: Record<string, unknown> = {
    isPublished: true,
    deletedAt: null,
  };

  if (params.areaId) where.areaId = BigInt(params.areaId);
  if (params.categoryId) {
    where.skills = { some: { categoryId: BigInt(params.categoryId) } };
  }
  if (params.categorySlug) {
    where.skills = { some: { category: { slug: params.categorySlug } } };
  }

  const orderByArray: any[] = [
    { isSponsored: "desc" },
    { priorityRank: "desc" },
  ];
  if (params.sort === "newest") {
    orderByArray.push({ createdAt: "desc" });
  } else {
    orderByArray.push(...artistPopularOrderBy);
  }

  const { skip, take } = getPageRange(page, limit);

  const [artists, total] = await Promise.all([
    prisma.artist.findMany({
      where,
      orderBy: orderByArray,
      skip,
      take,
      include: {
        area: {
          select: { id: true, prefecture: true, city: true },
        },
        skills: {
          orderBy: { sortOrder: "asc" },
          take: 12,
          select: {
            category: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: { select: { cases: true } },
      },
    }),
    prisma.artist.count({ where }),
  ]);

  const serialized = artists.map((a: any) => ({
    id: a.id.toString(),
    displayName: a.displayName,
    clinicName: a.clinicName,
    profileImgUrl: a.profileImgUrl,
    viewCount: Number(a.viewCount),
    area: {
      id: a.area.id.toString(),
      prefecture: a.area.prefecture,
      city: a.area.city,
    },
    skills: a.skills.map((s: any) => ({
      id: s.category.id.toString(),
      name: s.category.name,
      slug: s.category.slug,
    })),
    caseCount: a._count.cases,
    isSponsored: a.isSponsored,
  }));

  const totalNum = Number(total);
  const totalPages = Math.max(1, Math.ceil(totalNum / limit));

  return { data: serialized, total: totalNum, totalPages };
  },
  ["catalog-published-artists"],
  { revalidate: 60 }
);

export type BlogListRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  author: string;
  categories: { id: string; name: string; slug: string }[];
};

export const listPublishedBlogsPage = unstable_cache(
  async (params: {
    page: number;
    limit: number;
    categorySlug?: string;
  }): Promise<CasesPayload<BlogListRow>> => {
  const page = Math.max(1, params.page);
  const limit = Math.min(50, params.limit || ITEMS_PER_PAGE);

  const where: Record<string, unknown> = {
    isPublished: true,
    publishedAt: { not: null },
  };

  if (params.categorySlug) {
    where.categories = {
      some: { category: { slug: params.categorySlug } },
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

  const totalNum = Number(total);
  const totalPages = Math.max(1, Math.ceil(totalNum / limit));

  return { data: serialized, total: totalNum, totalPages };
  },
  ["catalog-published-blogs"],
  { revalidate: 60 }
);
