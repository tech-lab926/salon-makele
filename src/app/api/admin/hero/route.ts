import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const banners = await prisma.heroBanner.findMany({
      orderBy: { sortOrder: "asc" },
    });

    // Handle BigInt serialization if necessary
    const serializedBanners = banners.map((b: any) => ({
      ...b,
      id: b.id.toString(),
    }));

    return successResponse(serializedBanners);
  } catch (error) {
    console.error("Admin hero GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const { imageUrl, mobileImageUrl, altText, linkUrl, isActive, sortOrder } = body;

    if (!imageUrl) {
      return errorResponse("Desktop Image URL is required", 400);
    }
    if (!mobileImageUrl) {
      return errorResponse("Mobile Image URL is required", 400);
    }

    const banner = await prisma.heroBanner.create({
      data: {
        imageUrl,
        mobileImageUrl,
        altText,
        linkUrl,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return successResponse({
      ...banner,
      id: banner.id.toString(),
    });
  } catch (error) {
    console.error("Admin hero POST error:", error);
    return errorResponse("Internal server error", 500);
  }
}
