import { NextRequest } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, paginatedResponse } from "@/lib/api-response";
import { getPageRange } from "@/lib/utils";
import { ADMIN_ITEMS_PER_PAGE } from "@/constants";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || ADMIN_ITEMS_PER_PAGE),
    );
    const { skip, take } = getPageRange(page, limit);

    const roleParam = searchParams.get("role");
    const allowedRoles = new Set<string>(["ADMIN", "ARTIST", "USER"]);
    const where: { deletedAt: null; role?: Role } = { deletedAt: null };
    if (roleParam && allowedRoles.has(roleParam)) {
      where.role = roleParam as Role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: { bookings: true },
          },
          artist: {
            select: {
              _count: {
                select: { bookings: true },
              },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const serialized = users.map((u: any) => {
      let count: number | string = u._count?.bookings || 0;
      if (u.role === "ADMIN") {
        count = "対象外";
      } else if (u.role === "ARTIST") {
        count = u.artist?._count?.bookings || 0;
      }

      return {
        id: u.id.toString(),
        name: u.name || "Unknown",
        email: u.email || "",
        role: u.role,
        emailVerified: !!u.emailVerified,
        bookingCount: count,
        createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
      };
    });

    return paginatedResponse(serialized, Number(total), page, limit);
  } catch (error) {
    console.error("Admin users GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}
