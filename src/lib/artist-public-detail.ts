import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

/** Serialized artist payload — shared by `/api/artists/[id]` and `/artists/[id]` server render. */
export type PublishedArtistDetail = {
  id: string;
  displayName: string;
  bio: string | null;
  profileImgUrl: string | null;
  clinicName: string | null;
  clinicAddress: string | null;
  businessHours: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  yearsOfExperience: number | null;
  viewCount: number;
  area: { id: string; prefecture: string; city: string | null };
  skills: { id: string; name: string; slug: string }[];
  menus: {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    durationMin: number;
    category: { id: string; name: string };
  }[];
  cases: {
    id: string;
    title: string;
    beforeImgUrl: string;
    afterImgUrl: string;
    category: { id: string; name: string };
    technique: { id: string; name: string } | null;
  }[];
  reviews: {
    id: string;
    userName: string;
    avatarUrl: string | null;
    rating: number;
    comment: string;
    createdAt: string;
    menuName: string;
  }[];
  avgRating: number;
  reviewCount: number;
  caseCount: number;
  ratingDistribution: { s: number; c: number }[];
};

function parseArtistIdParam(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

export const getPublishedArtistDetailById = cache(
  async (id: string): Promise<PublishedArtistDetail | null> => {
    return unstable_cache(
      async () => {
        const numericId = parseArtistIdParam(id);
        if (numericId === null) return null;

        const artist = await prisma.artist.findFirst({
          where: { id: numericId, isPublished: true, deletedAt: null },
          include: {
            area: true,
            skills: { include: { category: true }, orderBy: { sortOrder: "asc" } },
            menus: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
              include: { category: true },
            },
            cases: {
              where: { isPublished: true, deletedAt: null },
              orderBy: { createdAt: "desc" },
              take: 20,
              include: { category: true, technique: true },
            },
            reviews: {
              take: 20,
              include: {
                user: { select: { name: true, avatarUrl: true } },
                booking: { include: { menu: { select: { name: true } } } },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        });

        if (!artist) return null;

        // PERF: Compute aggregates from a lightweight count/avg query
        // instead of loading all reviews into memory.
        const reviewAgg = await prisma.review.aggregate({
          where: { artistId: numericId },
          _count: true,
          _avg: { rating: true },
        }).catch(() => null);

        const caseCountAgg = await prisma.case.count({
          where: { artistId: numericId, isPublished: true, deletedAt: null },
        }).catch(() => 0);

        const reviewCount = reviewAgg?._count ?? artist.reviews.length;
        const avgRating = reviewAgg?._avg?.rating
          ? Number(reviewAgg._avg.rating.toFixed(1))
          : (artist.reviews.length > 0
            ? Number((artist.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / artist.reviews.length).toFixed(1))
            : 0);

        // Calculate rating distribution from loaded reviews (assuming all reviews or top reviews)
        // If we want exact, we would group by rating in DB, but since we only load top 20, we can use DB grouping.
        const ratingGroups = await prisma.review.groupBy({
          by: ['rating'],
          where: { artistId: numericId },
          _count: { rating: true }
        }).catch(() => []);

        const ratingDistribution = [5, 4, 3, 2, 1].map((s) => ({
          s,
          c: ratingGroups.find((g: any) => Math.floor(g.rating) === s)?._count.rating || 0
        }));

        return {
          id: artist.id.toString(),
          displayName: artist.displayName,
          bio: artist.bio,
          profileImgUrl: artist.profileImgUrl,
          clinicName: artist.clinicName,
          clinicAddress: artist.clinicAddress,
          businessHours: artist.businessHours,
          instagramUrl: artist.instagramUrl,
          twitterUrl: artist.twitterUrl,
          yearsOfExperience: artist.yearsOfExperience,
          viewCount: Number(artist.viewCount || 0),
          area: {
            id: artist.area?.id?.toString() ?? "0",
            prefecture: artist.area?.prefecture ?? "不明",
            city: artist.area?.city ?? null,
          },
          skills: (artist.skills || []).map((s: any) => ({
            id: s.category?.id?.toString() ?? "0",
            name: s.category?.name ?? "不明",
            slug: s.category?.slug ?? "unknown",
          })),
          menus: (artist.menus || []).map((m: any) => ({
            id: m.id.toString(),
            name: m.name,
            description: m.description,
            price: m.price,
            durationMin: m.durationMin,
            category: { 
              id: m.category?.id?.toString() ?? "0", 
              name: m.category?.name ?? "不明" 
            },
          })),
          cases: (artist.cases || []).map((c: any) => ({
            id: c.id.toString(),
            title: c.title,
            beforeImgUrl: c.beforeImgUrl,
            afterImgUrl: c.afterImgUrl,
            category: { 
              id: c.category?.id?.toString() ?? "0", 
              name: c.category?.name ?? "不明" 
            },
            technique: c.technique
              ? { id: c.technique.id.toString(), name: c.technique.name }
              : null,
          })),
          reviews: (artist.reviews || []).map((r: any) => ({
            id: r.id.toString(),
            userName: r.user.name,
            avatarUrl: r.user.avatarUrl,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt.toISOString().split("T")[0],
            menuName: r.booking?.menu?.name ?? "施術メニュー",
          })),
          avgRating,
          reviewCount,
          caseCount: caseCountAgg,
          ratingDistribution,
        };
      },
      ["artist-detail", id],
      { revalidate: 60 }
    )();
  },
);
