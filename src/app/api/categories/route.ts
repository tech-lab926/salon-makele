import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const minimal =
      request.nextUrl.searchParams.get("minimal") === "1" ||
      request.nextUrl.searchParams.get("minimal") === "true";

    if (minimal) {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { cases: true } },
        },
      });
      const serialized = categories.map((c: any) => ({
        id: c.id.toString(),
        name: c.name,
        slug: c.slug,
        caseCount: c._count.cases,
      }));
      return successResponse(serialized, 200, { cacheSeconds: 120, skipSerialization: true });
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        techniques: { orderBy: { sortOrder: "asc" } },
        _count: { select: { cases: true } },
      },
    });

    const serialized = categories.map((c: any) => ({
      id: c.id.toString(),
      name: c.name,
      slug: c.slug,
      techniques: c.techniques.map((t: any) => ({
        id: t.id.toString(),
        name: t.name,
      })),
      caseCount: c._count.cases,
    }));

    return successResponse(serialized, 200, { cacheSeconds: 120, skipSerialization: true });
  } catch (error) {
    console.error("Categories error:", error);
    return errorResponse("Internal server error", 500);
  }
}
