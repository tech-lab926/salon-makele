import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const body = await request.json();
    const { name, slug, isActive, sortOrder } = body;

    if (!name || !slug) {
      return errorResponse("Name and slug are required", 400);
    }

    const trimmedName = name.trim().slice(0, 50);
    const trimmedSlug = slug.trim().toLowerCase().slice(0, 50);

    if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
      return errorResponse("Slug contains invalid characters", 400);
    }

    if (!/^\d+$/.test(id)) return errorResponse("Invalid category ID", 400);

    await prisma.category.update({
      where: { id: BigInt(id) },
      data: {
        name: trimmedName,
        slug: trimmedSlug,
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : undefined,
      },
    });

    return successResponse({ message: "Category updated" });
  } catch (error) {
    console.error("Admin category PATCH error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    if (!/^\d+$/.test(id)) return errorResponse("Invalid category ID", 400);
    const categoryId = BigInt(id);

    const [techniqueCount, caseCount, artistSkillCount, menuCount, blogCategoryCount] =
      await Promise.all([
        prisma.technique.count({ where: { categoryId } }),
        prisma.case.count({ where: { categoryId } }),
        prisma.artistSkill.count({ where: { categoryId } }),
        prisma.menu.count({ where: { categoryId } }),
        prisma.blogCategory.count({ where: { categoryId } }),
      ]);

    if (techniqueCount || caseCount || artistSkillCount || menuCount || blogCategoryCount) {
      return errorResponse(
        "This category is in use and cannot be deleted yet",
        409,
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return successResponse({ message: "Category deleted" });
  } catch (error) {
    console.error("Admin category DELETE error:", error);
    return errorResponse("Internal server error", 500);
  }
}
