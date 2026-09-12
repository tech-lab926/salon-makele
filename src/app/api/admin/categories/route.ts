import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { getPageRange } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const { skip, take } = getPageRange(page, limit);

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        skip,
        take,
        include: {
          techniques: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, sortOrder: true } },
          _count: { select: { cases: true, artistSkills: true } },
        },
      }),
      prisma.category.count(),
    ]);

    const serialized = categories.map((c: any) => ({
      id: c.id?.toString() || "0",
      name: c.name || "Unknown",
      slug: c.slug || "unknown",
      isActive: !!c.isActive,
      techniques: (c.techniques || []).map((t: any) => ({
        id: t.id.toString(),
        name: t.name,
        sortOrder: t.sortOrder,
      })),
      caseCount: c._count?.cases || 0,
      artistCount: c._count?.artistSkills || 0,
    }));

    return paginatedResponse(serialized, Number(total), page, limit);
  } catch (error) {
    console.error("Admin categories GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const rawName = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
    const rawSlug = typeof body.slug === "string" ? body.slug.trim().slice(0, 100) : "";
    const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;

    if (!rawName || !rawSlug) {
      return errorResponse("Name and slug are required", 400);
    }

    // Slug must be URL-safe: lowercase letters, digits, hyphens only.
    if (!/^[a-z0-9-]+$/.test(rawSlug)) {
      return errorResponse("Slug must contain only lowercase letters, numbers, and hyphens", 400);
    }

    const category = await prisma.category.create({
      data: { name: rawName, slug: rawSlug, sortOrder },
    });

    return successResponse({ id: category.id.toString() }, 201);
  } catch (error) {
    console.error("Admin category POST error:", error);
    return errorResponse("Internal server error", 500);
  }
}
