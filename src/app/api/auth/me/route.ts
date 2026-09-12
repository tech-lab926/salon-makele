import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser, normalizeRole } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return successResponse(null);
    }

    if (!/^\d+$/.test(user.userId)) {
      return successResponse(null);
    }
    const userId = user.userId;

    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(userId) },
      select: { name: true, role: true, image: true, avatarUrl: true, deletedAt: true },
    });

    if (!dbUser || dbUser.deletedAt) {
      return successResponse(null);
    }

    let dashboardUrl = "/";
    if (dbUser.role === Role.ADMIN) dashboardUrl = "/admin";
    else if (dbUser.role === Role.ARTIST) dashboardUrl = "/dashboard";
    else dashboardUrl = "/mypage";

    return successResponse({
      id: user.userId,
      name: dbUser.name,
      image: dbUser.image || dbUser.avatarUrl || null,
      role: normalizeRole(String(dbUser.role)),
      dashboardUrl,
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return errorResponse("Internal server error", 500);
  }
}
