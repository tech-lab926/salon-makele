
import { prisma } from "@/lib/prisma";

interface BufferState {
  counts: Map<string, number>;
  recentViews: Map<string, number>;
  timer: ReturnType<typeof setTimeout> | null;
}

const FLUSH_INTERVAL_MS = 60_000;
/** Same window as DB dedup in /api/views (cross-instance). */
export const DEDUP_WINDOW_MS = 30 * 60_000;

/** Parallel Prisma updates per flush batch (avoid unbounded connection use). */
const FLUSH_CONCURRENCY = 16;

const globalForBuffer = globalThis as unknown as {
  __viewBuffer: BufferState | undefined;
};

function getBuffer(): BufferState {
  if (!globalForBuffer.__viewBuffer) {
    globalForBuffer.__viewBuffer = {
      counts: new Map(),
      recentViews: new Map(),
      timer: null,
    };
  }
  return globalForBuffer.__viewBuffer;
}

/** True if this viewer already hit the same target within the dedup window (same Node process). */
export function isViewRecentlyBuffered(
  viewerKey: string,
  targetType: string,
  targetId: string,
): boolean {
  const buf = getBuffer();
  const dedupKey = `${viewerKey}:${targetType}:${targetId}`;
  const lastView = buf.recentViews.get(dedupKey);
  if (!lastView) return false;
  return Date.now() - lastView < DEDUP_WINDOW_MS;
}

/** Prune oldest entries if Map size exceeds limit (Map iteration follows insertion order). */
function pruneRecentViews(buf: BufferState, now: number) {
  if (buf.recentViews.size <= 10000) return;

  // 1. Try to remove expired entries first.
  for (const [k, v] of buf.recentViews) {
    if (now - v > DEDUP_WINDOW_MS) {
      buf.recentViews.delete(k);
    }
    if (buf.recentViews.size <= 5000) break;
  }

  // 2. If still over limit, force-remove oldest regardless of age.
  if (buf.recentViews.size > 10000) {
    for (const [k] of buf.recentViews) {
      buf.recentViews.delete(k);
      if (buf.recentViews.size <= 5000) break;
    }
  }
}

/** Mark dedup so repeat requests skip DB (e.g. after findFirst found an existing row). */
export function markViewBuffered(
  viewerKey: string,
  targetType: string,
  targetId: string,
): void {
  const buf = getBuffer();
  const dedupKey = `${viewerKey}:${targetType}:${targetId}`;
  const now = Date.now();
  buf.recentViews.set(dedupKey, now);
  pruneRecentViews(buf, now);
}

export function recordView(
  targetType: string,
  targetId: string,
  viewerKey: string,
): boolean {
  const buf = getBuffer();
  const dedupKey = `${viewerKey}:${targetType}:${targetId}`;
  const now = Date.now();

  const lastView = buf.recentViews.get(dedupKey);
  if (lastView && now - lastView < DEDUP_WINDOW_MS) {
    return false;
  }

  buf.recentViews.set(dedupKey, now);
  pruneRecentViews(buf, now);

  const countKey = `${targetType}:${targetId}`;
  buf.counts.set(countKey, (buf.counts.get(countKey) || 0) + 1);

  if (!buf.timer) {
    buf.timer = setTimeout(() => flushViews(), FLUSH_INTERVAL_MS);
  }

  return true;
}

export async function flushViews(): Promise<number> {
  const buf = getBuffer();
  const entries = Array.from(buf.counts.entries());
  buf.counts.clear();
  buf.timer = null;

  const now = Date.now();
  for (const [key, ts] of buf.recentViews.entries()) {
    if (now - ts > DEDUP_WINDOW_MS) {
      buf.recentViews.delete(key);
    }
  }

  if (entries.length === 0) return 0;

  // Aggregate counts by target type and id to perform batched updates.
  const byType: Record<string, Map<string, number>> = { artist: new Map(), case: new Map() };
  for (const [key, count] of entries) {
    const colon = key.indexOf(":");
    if (colon <= 0) continue;
    const targetType = key.slice(0, colon);
    const targetId = key.slice(colon + 1);
    if (!byType[targetType]) continue;
    byType[targetType].set(targetId, (byType[targetType].get(targetId) || 0) + count);
  }

  let flushed = 0;

  // Helper: execute safe parameterized updates for a given table in bounded parallel batches.
  // This replaces the previous $executeRawUnsafe path: Prisma's ORM query builder
  // uses fully parameterized SQL, eliminating any injection risk regardless of input.
  async function batchUpdate(table: "artists" | "cases", map: Map<string, number>) {
    if (map.size === 0) return 0;
    let total = 0;
    const entries = Array.from(map.entries());

    for (let i = 0; i < entries.length; i += FLUSH_CONCURRENCY) {
      const chunk = entries.slice(i, i + FLUSH_CONCURRENCY);
      await Promise.all(
        chunk.map(async ([id, cnt]: any) => {
          try {
            const idBig = BigInt(id);
            const incBig = BigInt(cnt);
            if (table === "artists") {
              await prisma.artist.update({
                where: { id: idBig, deletedAt: null },
                data: { viewCount: { increment: incBig }, rankingScore: { increment: cnt } },
              });
            } else {
              await prisma.case.update({
                where: { id: idBig, deletedAt: null },
                data: { viewCount: { increment: incBig }, rankingScore: { increment: cnt } },
              });
            }
            total += cnt;
          } catch {
            // On failure, re-queue counts for the next flush cycle.
            const key = `${table === "artists" ? "artist" : "case"}:${id}`;
            buf.counts.set(key, (buf.counts.get(key) || 0) + cnt);
          }
        }),
      );
    }
    return total;
  }

  // Execute batched updates with limited concurrency.
  const typeEntries: Array<Promise<number>> = [];
  if (byType.artist.size > 0) typeEntries.push(batchUpdate("artists", byType.artist));
  if (byType.case.size > 0) typeEntries.push(batchUpdate("cases", byType.case));

  const results = await Promise.all(typeEntries);
  for (const r of results) flushed += r;

  return flushed;
}
