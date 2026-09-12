import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const caseItem = await prisma.case.findFirst({
      where: { id: BigInt(id), isPublished: true, deletedAt: null },
      include: {
        artist: {
          select: { id: true, displayName: true, profileImgUrl: true, area: true },
        },
        category: true,
        technique: true,
      },
    });

    if (!caseItem) {
      return errorResponse("Case not found", 404);
    }

    const serialized = {
      id: caseItem.id.toString(),
      title: caseItem.title,
      description: caseItem.description,
      beforeImgUrl: caseItem.beforeImgUrl,
      afterImgUrl: caseItem.afterImgUrl,
      sessionCount: caseItem.sessionCount,
      downtimeDays: caseItem.downtimeDays,
      downtimeNote: caseItem.downtimeNote,
      viewCount: Number(caseItem.viewCount),
      createdAt: caseItem.createdAt.toISOString(),
      artist: {
        id: caseItem.artist.id.toString(),
        displayName: caseItem.artist.displayName,
        profileImgUrl: caseItem.artist.profileImgUrl,
        area: {
          prefecture: caseItem.artist.area.prefecture,
          city: caseItem.artist.area.city,
        },
      },
      category: {
        id: caseItem.category.id.toString(),
        name: caseItem.category.name,
        slug: caseItem.category.slug,
      },
      technique: caseItem.technique
        ? { id: caseItem.technique.id.toString(), name: caseItem.technique.name }
        : null,
    };

    return successResponse(serialized);
  } catch (error) {
    console.error("Case detail error:", error);
    return errorResponse("Internal server error", 500);
  }
}
