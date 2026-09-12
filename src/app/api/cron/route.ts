import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { VIEW_HISTORY_RETENTION_DAYS } from "@/constants";
import { opendir, unlink, stat } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && cronSecret.trim() !== "" && authHeader === `Bearer ${cronSecret}`) {
      // Authenticated via cron secret
    } else {
      const user = await getAuthUser();
      if (!user || user.role !== "admin") {
        return errorResponse("Unauthorized", 401);
      }
    }

    const { flushViews } = await import("@/lib/view-buffer");
    const viewFlushCount = await flushViews();

    const results: Record<string, unknown> = { viewBufferFlushed: viewFlushCount };

    const [artistCount, caseCount] = await Promise.all([
      prisma.artist.count({ where: { deletedAt: null } }),
      prisma.case.count({ where: { deletedAt: null } }),
    ]);

    await prisma.$executeRaw`
      UPDATE artists
      SET ranking_score = view_count::numeric, updated_at = NOW()
      WHERE deleted_at IS NULL AND ranking_score != view_count::numeric
    `;

    await prisma.$executeRaw`
      UPDATE cases
      SET ranking_score = view_count::numeric, updated_at = NOW()
      WHERE deleted_at IS NULL AND ranking_score != view_count::numeric
    `;

    await prisma.$executeRaw`
      INSERT INTO ranking_scores (target_type, target_id, view_count, score, calculated_at)
      SELECT 'artist', id, view_count, view_count * 1.0, NOW()
      FROM artists WHERE deleted_at IS NULL
      ON CONFLICT (target_type, target_id) DO UPDATE
      SET view_count = EXCLUDED.view_count, score = EXCLUDED.score, calculated_at = NOW()
      WHERE ranking_scores.view_count IS DISTINCT FROM EXCLUDED.view_count
    `.catch(() => {});

    await prisma.$executeRaw`
      INSERT INTO ranking_scores (target_type, target_id, view_count, score, calculated_at)
      SELECT 'case', id, view_count, view_count * 1.0, NOW()
      FROM cases WHERE deleted_at IS NULL
      ON CONFLICT (target_type, target_id) DO UPDATE
      SET view_count = EXCLUDED.view_count, score = EXCLUDED.score, calculated_at = NOW()
      WHERE ranking_scores.view_count IS DISTINCT FROM EXCLUDED.view_count
    `.catch(() => {});

    results.ranking = { artistUpdates: artistCount, caseUpdates: caseCount };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - VIEW_HISTORY_RETENTION_DAYS);

    const deletedViews = await prisma.viewHistory.deleteMany({
      where: { viewedAt: { lt: cutoffDate } },
    });

    results.viewHistoryCleanup = { deletedCount: deletedViews.count };

    const deletedSessions = await prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    results.sessionCleanup = { deletedCount: deletedSessions.count };

    try {
      const uploadDir =
        process.env.UPLOAD_DIR ||
        join(/*turbopackIgnore: true*/ process.cwd(), "public/uploads");
      const dir = await opendir(uploadDir).catch(() => null);

      if (dir) {
        // 1. Fetch ALL used filenames from the DB in one go to avoid repeated scans
        const [usedArtists, usedCases] = await Promise.all([
          prisma.artist.findMany({
            where: { deletedAt: null, profileImgUrl: { not: null } },
            select: { profileImgUrl: true },
          }),
          prisma.case.findMany({
            where: { deletedAt: null },
            select: { beforeImgUrl: true, afterImgUrl: true },
          }),
        ]);

        const extractFilename = (url: string | null) => {
          if (!url) return null;
          return url.split("/").pop()?.split("?")[0];
        };

        const usedSet = new Set<string>();
        usedArtists.forEach((a: any) => {
          const f = extractFilename(a.profileImgUrl);
          if (f) usedSet.add(f);
        });
        usedCases.forEach((c: any) => {
          const fBefore = extractFilename(c.beforeImgUrl);
          const fAfter = extractFilename(c.afterImgUrl);
          if (fBefore) usedSet.add(fBefore);
          if (fAfter) usedSet.add(fAfter);
        });

        // 2. Iterate through disk and delete unused files
        let deletedFilesCount = 0;
        const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000; // 24 hours
        const now = Date.now();

        for await (const entry of dir) {
          if (!entry.isFile()) continue;
          const fileName = entry.name;

          // Skip non-images
          if (!fileName.match(/\.(jpg|jpeg|png|webp|gif)$/i)) continue;

          // Check if used
          if (usedSet.has(fileName)) continue;

          // Check age - only clean up files older than the grace period
          try {
            const stats = await stat(join(uploadDir, fileName));
            if (now - stats.mtimeMs < GRACE_PERIOD_MS) continue;
            
            await unlink(join(uploadDir, fileName));
            deletedFilesCount++;
          } catch {
            continue;
          }
        }

        results.fileCleanup = { deletedCount: deletedFilesCount };
      }
    } catch (gcError) {
      console.error("Garbage collection error:", gcError);
    }

    try {
      const today = new Date();
      // On the 1st day of the month, generate invoices for the previous month
      if (today.getDate() === 1) {
        const lastMonth = new Date(Date.UTC(today.getFullYear(), today.getMonth() - 1, 1));
        const periodStart = new Date(Date.UTC(lastMonth.getFullYear(), lastMonth.getMonth(), 1));
        const periodEnd = new Date(Date.UTC(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0, 23, 59, 59, 999));

        const artistGroups = await prisma.bookingFee.groupBy({
          by: ['artistId'],
          where: {
            status: "PENDING",
            createdAt: { gte: periodStart, lte: periodEnd }
          }
        });

        if (artistGroups.length > 0) {
          const { getArtistActivePlan } = await import("@/lib/subscription");

          // Process per-artist invoice creation in bounded parallel batches to avoid long sequential runs
          const CONCURRENCY = 5;
          let draftCount = 0;

          for (let i = 0; i < artistGroups.length; i += CONCURRENCY) {
            const batch = artistGroups.slice(i, i + CONCURRENCY).map(async ({ artistId }: any) => {
              try {
                const fees = await prisma.bookingFee.findMany({
                  where: {
                    artistId,
                    status: "PENDING",
                    createdAt: { gte: periodStart, lte: periodEnd }
                  }
                });

                if (fees.length === 0) return false;

                const activePlanInfo = await getArtistActivePlan(artistId);
                const listingFee = activePlanInfo.isTrial ? 0 : activePlanInfo.plan.monthlyFee;
                const totalBookingFees = fees.reduce((sum: number, f: any) => sum + f.feeAmount, 0);

                await prisma.$transaction(async (tx: any) => {
                  const invoice = await tx.invoice.create({
                    data: {
                      artistId,
                      periodStart,
                      periodEnd,
                      listingFee,
                      totalBookingFees,
                      totalAmount: listingFee + totalBookingFees,
                      status: "DRAFT",
                    },
                  });
                  await tx.bookingFee.updateMany({
                    where: { id: { in: fees.map((f: any) => f.id) } },
                    data: { invoiceId: invoice.id, status: "INVOICED" },
                  });
                });

                return true;
              } catch (e) {
                console.error("Invoice generation failed for artist", artistId.toString(), e);
                return false;
              }
            });

            const resultsBatch = await Promise.all(batch);
            draftCount += resultsBatch.filter(Boolean).length;
          }

          results.invoices = { drafted: draftCount };
        }
      }
    } catch (invoiceErr) {
      console.error("Auto-invoice generation error:", invoiceErr);
    }

    return successResponse({
      message: "Maintenance tasks completed",
      ...results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return errorResponse("Internal server error", 500);
  }
}
