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

    const techniques = await prisma.technique.findMany({
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: { category: { select: { id: true, name: true } } },
    });

    const serialized = techniques.map((t: any) => ({
      id: t.id.toString(),
      name: t.name,
      sortOrder: t.sortOrder,
      categoryId: t.categoryId.toString(),
      categoryName: t.category.name,
    }));

    return successResponse(serialized);
  } catch (error) {
    console.error("Admin techniques GET error:", error);
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
    const { categoryId, sortOrder } = body;

    if (!rawName || !categoryId) {
      return errorResponse("Name and categoryId are required", 400);
    }

    if (!/^\d+$/.test(String(categoryId))) {
      return errorResponse("Invalid categoryId", 400);
    }

    const technique = await prisma.technique.create({
      data: {
        name: rawName,
        categoryId: BigInt(categoryId),
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0,
      },
    });

    return successResponse({ id: technique.id.toString() }, 201);
  } catch (error) {
    console.error("Admin technique POST error:", error);
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
    const { id, name, categoryId, sortOrder } = body;

    if (!id || !/^\d+$/.test(String(id))) {
      return errorResponse("Invalid technique ID", 400);
    }

    const trimmedName = typeof name === "string" ? name.trim().slice(0, 100) : undefined;
    
    await prisma.technique.update({
      where: { id: BigInt(id) },
      data: {
        ...(trimmedName ? { name: trimmedName } : {}),
        ...(categoryId ? { categoryId: BigInt(categoryId) } : {}),
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : undefined,
      },
    });

    return successResponse({ message: "Technique updated" });
  } catch (error) {
    console.error("Admin technique PATCH error:", error);
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
    if (!id || !/^\d+$/.test(String(id))) return errorResponse("Valid ID is required", 400);

    await prisma.technique.delete({ where: { id: BigInt(id) } });

    return successResponse({ message: "Technique deleted" });
  } catch (error) {
    console.error("Admin technique DELETE error:", error);
    return errorResponse("Internal server error", 500);
  }
}
