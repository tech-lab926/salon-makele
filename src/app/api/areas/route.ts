import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
export async function GET() {
  try {
    const areas = await prisma.area.findMany({
      where: {
        artists: { some: { isPublished: true, deletedAt: null } },
      },
      orderBy: { sortOrder: "asc" },
    });

    const serialized = areas.map((a: any) => ({
      id: a.id.toString(),
      prefecture: a.prefecture,
      city: a.city,
    }));

    return successResponse(serialized, 200, { cacheSeconds: 3600, skipSerialization: true });
  } catch (error) {
    console.error("Areas error:", error);
    return errorResponse("Internal server error", 500);
  }
}
