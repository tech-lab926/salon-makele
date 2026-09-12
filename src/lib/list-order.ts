import type { Prisma } from "@prisma/client";

/** Tie-breakers so “popular” reflects live view_count before cron syncs ranking_score (REQUIREMENTS §8.2 MVP). */
export const artistPopularOrderBy: Prisma.ArtistOrderByWithRelationInput[] = [
  { rankingScore: "desc" },
  { viewCount: "desc" },
  { id: "asc" },
];

export const casePopularOrderBy: Prisma.CaseOrderByWithRelationInput[] = [
  { rankingScore: "desc" },
  { viewCount: "desc" },
  { id: "asc" },
];
