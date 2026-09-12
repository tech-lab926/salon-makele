import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const areas = await prisma.area.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { artists: { where: { deletedAt: null } } } },
      },
    });

    const serialized = areas.map((a: any) => ({
      id: a.id.toString(),
      prefecture: a.prefecture,
      city: a.city,
      sortOrder: a.sortOrder,
      artistCount: a._count.artists,
    }));

    return successResponse(serialized);
  } catch (error) {
    console.error("Admin areas GET error:", error);
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
    const { prefecture, city, sortOrder } = body;

    const prefectureText = typeof prefecture === "string" ? prefecture.trim() : "";
    const cityText = typeof city === "string" ? city.trim() : "";

    if (!prefectureText) {
      return errorResponse("Prefecture is required", 400);
    }

    if (prefectureText.length > 20) {
      return errorResponse("Prefecture must be 20 characters or fewer", 400);
    }

    if (cityText.length > 50) {
      return errorResponse("City must be 50 characters or fewer", 400);
    }

    const area = await prisma.area.create({
      data: {
        prefecture: prefectureText,
        city: cityText || null,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
      },
    });

    return successResponse({ id: area.id.toString() }, 201);
  } catch (error) {
    console.error("Admin area POST error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { id, prefecture, city, sortOrder } = body;

    if (!id || !/^\d+$/.test(String(id))) {
      return errorResponse("Invalid area ID", 400);
    }

    const prefectureText = typeof prefecture === "string" ? prefecture.trim() : "";
    const cityText = typeof city === "string" ? city.trim() : "";

    if (!prefectureText) {
      return errorResponse("Prefecture is required", 400);
    }

    if (prefectureText.length > 20) {
      return errorResponse("Prefecture must be 20 characters or fewer", 400);
    }

    if (cityText.length > 50) {
      return errorResponse("City must be 50 characters or fewer", 400);
    }

    const updated = await prisma.area.update({
      where: { id: BigInt(id) },
      data: {
        prefecture: prefectureText,
        city: cityText || null,
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
      },
    });

    return successResponse({ id: updated.id.toString() });
  } catch (error) {
    console.error("Admin area PATCH error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id || !/^\d+$/.test(id)) return errorResponse("Invalid area ID", 400);

    const area = await prisma.area.findUnique({
      where: { id: BigInt(id) },
      include: { _count: { select: { artists: true } } },
    });

    if (area && area._count.artists > 0) {
      return errorResponse("このエリアにアーティストが紐付いているため削除できません", 400);
    }

    await prisma.area.delete({ where: { id: BigInt(id) } });
    return successResponse({ message: "Area deleted" });
  } catch (error) {
    console.error("Admin area DELETE error:", error);
    return errorResponse("Internal server error", 500);
  }
}
