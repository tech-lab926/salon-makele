import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const body = await req.json();

    const banner = await prisma.heroBanner.update({
      where: { id: BigInt(id) },
      data: body,
    });

    return successResponse({
      ...banner,
      id: banner.id.toString(),
    });
  } catch (error) {
    console.error("Admin hero PATCH error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;

    await prisma.heroBanner.delete({
      where: { id: BigInt(id) },
    });

    return successResponse({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Admin hero DELETE error:", error);
    return errorResponse("Internal server error", 500);
  }
}
