import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

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

    return successResponse({
      message: "Ranking scores updated",
      artistUpdates: artistCount,
      caseUpdates: caseCount,
    });
  } catch (error) {
    console.error("Ranking calculation error:", error);
    return errorResponse("Internal server error", 500);
  }
}
