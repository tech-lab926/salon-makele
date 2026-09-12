import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

type HistoryRow = {
  id: bigint;
  target_type: string;
  target_id: bigint;
  viewed_at: Date;
};

type HistoryApiItem = {
  type: "artist" | "case";
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  viewedAt: string;
};

export async function GET() {
  try {
    const user = await getAuthUser();

    let history: HistoryRow[];

    if (user) {
      if (!/^\d+$/.test(user.userId)) return successResponse([]);
      history = (await (prisma as any).$queryRaw`
        WITH latest AS (
          SELECT DISTINCT ON (target_type, target_id)
            id, target_type, target_id, viewed_at
          FROM view_history
          WHERE user_id = ${BigInt(user.userId)}
          ORDER BY target_type, target_id, viewed_at DESC
        )
        SELECT id, target_type, target_id, viewed_at
        FROM latest
        ORDER BY viewed_at DESC
        LIMIT 20
      `) as HistoryRow[];
    } else {
      const sessionKey = (await cookies()).get("session_key")?.value;
      if (!sessionKey) {
        return successResponse([]);
      }
      const key = sessionKey.slice(0, 64);
      history = (await (prisma as any).$queryRaw`
        WITH latest AS (
          SELECT DISTINCT ON (target_type, target_id)
            id, target_type, target_id, viewed_at
          FROM view_history
          WHERE session_key = ${key} AND user_id IS NULL
          ORDER BY target_type, target_id, viewed_at DESC
        )
        SELECT id, target_type, target_id, viewed_at
        FROM latest
        ORDER BY viewed_at DESC
        LIMIT 20
      `) as HistoryRow[];
    }

    const artistIds = history
      .filter((h: any) => h.target_type === "artist")
      .map((h: any) => h.target_id);
    const caseIds = history
      .filter((h: any) => h.target_type === "case")
      .map((h: any) => h.target_id);

    const [artists, cases] = await Promise.all([
      artistIds.length > 0
        ? prisma.artist.findMany({
            where: {
              id: { in: artistIds },
              isPublished: true,
              deletedAt: null,
            },
            select: {
              id: true,
              displayName: true,
              profileImgUrl: true,
              area: { select: { prefecture: true } },
            },
          })
        : [],
      caseIds.length > 0
        ? prisma.case.findMany({
            where: {
              id: { in: caseIds },
              isPublished: true,
              deletedAt: null,
            },
            select: {
              id: true,
              title: true,
              beforeImgUrl: true,
              afterImgUrl: true,
              category: { select: { name: true } },
              artist: { select: { displayName: true } },
            },
          })
        : [],
    ]);

    const artistMap = new Map<string, any>(artists.map((a: any) => [a.id.toString(), a]));
    const caseMap = new Map<string, any>(cases.map((c: any) => [c.id.toString(), c]));

    /** Only list targets that are still publicly visible (no stale links to 404s). */
    const items: HistoryApiItem[] = history.flatMap((h): HistoryApiItem[] => {
      const targetId = h.target_id.toString();
      if (h.target_type === "artist") {
        const a = artistMap.get(targetId);
        if (!a) return [];
        return [
          {
            type: "artist",
            id: targetId,
            title: a.displayName,
            subtitle: a.area.prefecture,
            imageUrl: a.profileImgUrl,
            viewedAt: h.viewed_at.toISOString(),
          },
        ];
      }
      if (h.target_type === "case") {
        const c = caseMap.get(targetId);
        if (!c) return [];
        return [
          {
            type: "case",
            id: targetId,
            title: c.title,
            subtitle: `${c.category.name} / ${c.artist.displayName}`,
            imageUrl: c.afterImgUrl || c.beforeImgUrl,
            viewedAt: h.viewed_at.toISOString(),
          },
        ];
      }
      return [];
    });

    return successResponse(items);
  } catch (error) {
    console.error("View history error:", error);
    return errorResponse("Internal server error", 500);
  }
}
