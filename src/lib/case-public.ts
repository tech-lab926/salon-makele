import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { casePopularOrderBy } from "@/lib/list-order";

/** Serialized case — public detail page + metadata (matches former `/api/cases/[id]` shape). */
export type PublishedCaseDetailSerialized = {
  id: string;
  title: string;
  description: string;
  beforeImgUrl: string | null;
  afterImgUrl: string | null;
  sessionCount: number | null;
  downtimeDays: number | null;
  downtimeNote: string | null;
  viewCount: number;
  createdAt: string;
  artist: {
    id: string;
    displayName: string;
    profileImgUrl: string | null;
    area: { prefecture: string; city: string | null };
  };
  category: { id: string; name: string; slug: string };
  technique: { id: string; name: string } | null;
  menu: { id: string; name: string; price: number | null; durationMin: number } | null;
};

export type RelatedPublishedCaseItem = {
  id: string;
  title: string;
  beforeImgUrl: string | null;
  afterImgUrl: string | null;
  artist: { id: string; displayName: string; profileImgUrl: string | null };
  category: { id: string; name: string; slug: string };
  technique: { id: string; name: string } | null;
};

function parseBigIntId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

/** Direct DB load for RSC — avoids HTTP self-fetch latency vs `/api/cases/[id]`. */
export const getPublishedCaseDetailSerialized = cache(
  async (id: string): Promise<PublishedCaseDetailSerialized | null> => {
    return unstable_cache(
      async () => {
        const numericId = parseBigIntId(id);
        if (numericId === null) return null;

        const caseItem = await prisma.case.findFirst({
          where: {
            id: numericId,
            isPublished: true,
            deletedAt: null,
            artist: { isPublished: true, deletedAt: null },
          },
          include: {
            artist: {
              select: { id: true, displayName: true, profileImgUrl: true, area: true },
            },
            category: true,
            technique: true,
            menu: true,
          },
        });

        if (!caseItem) return null;

        return {
          id: caseItem.id.toString(),
          title: caseItem.title,
          description: caseItem.description,
          beforeImgUrl: caseItem.beforeImgUrl,
          afterImgUrl: caseItem.afterImgUrl,
          sessionCount: caseItem.sessionCount,
          downtimeDays: caseItem.downtimeDays,
          downtimeNote: caseItem.downtimeNote,
          viewCount: Number(caseItem.viewCount || 0),
          createdAt: new Date(caseItem.createdAt).toISOString(),
          artist: {
            id: caseItem.artist?.id?.toString() ?? "0",
            displayName: caseItem.artist?.displayName ?? "不明",
            profileImgUrl: caseItem.artist?.profileImgUrl ?? null,
            area: {
              prefecture: caseItem.artist?.area?.prefecture ?? "不明",
              city: caseItem.artist?.area?.city ?? null,
            },
          },
          category: {
            id: caseItem.category?.id?.toString() ?? "0",
            name: caseItem.category?.name ?? "不明",
            slug: caseItem.category?.slug ?? "unknown",
          },
          technique: caseItem.technique
            ? { id: caseItem.technique.id.toString(), name: caseItem.technique.name }
            : null,
          menu: caseItem.menu
            ? {
                id: caseItem.menu.id.toString(),
                name: caseItem.menu.name,
                price: caseItem.menu.price,
                durationMin: caseItem.menu.durationMin,
              }
            : null,
        };
      },
      ["case-detail", id],
      { revalidate: 60 }
    )();
  },
);

export const getPublishedRelatedCases = cache(
  async (categoryId: string, excludeCaseId: string): Promise<RelatedPublishedCaseItem[]> => {
    return unstable_cache(
      async () => {
        const catId = parseBigIntId(categoryId);
        const exId = parseBigIntId(excludeCaseId);
        if (catId === null || exId === null) return [];

        const cases = await prisma.case.findMany({
          where: {
            categoryId: catId,
            id: { not: exId },
            isPublished: true,
            deletedAt: null,
            artist: { isPublished: true, deletedAt: null },
          },
          orderBy: casePopularOrderBy,
          take: 3,
          select: {
            id: true,
            title: true,
            beforeImgUrl: true,
            afterImgUrl: true,
            artist: { select: { id: true, displayName: true, profileImgUrl: true } },
            category: true,
            technique: true,
          },
        });

        return cases.map((c: any) => ({
          id: c.id.toString(),
          title: c.title,
          beforeImgUrl: c.beforeImgUrl,
          afterImgUrl: c.afterImgUrl,
          artist: {
            id: c.artist?.id?.toString() ?? "0",
            displayName: c.artist?.displayName ?? "不明",
            profileImgUrl: c.artist?.profileImgUrl ?? null,
          },
          category: {
            id: c.category?.id?.toString() ?? "0",
            name: c.category?.name ?? "不明",
            slug: c.category?.slug ?? "unknown",
          },
          technique: c.technique
            ? { id: c.technique.id.toString(), name: c.technique.name }
            : null,
        }));
      },
      ["related-cases", categoryId, excludeCaseId],
      { revalidate: 120 }
    )();
  },
);
