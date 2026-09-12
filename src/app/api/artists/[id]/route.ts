import { NextRequest } from "next/server";
import { getPublishedArtistDetailById } from "@/lib/artist-public-detail";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const serialized = await getPublishedArtistDetailById(id);

    if (!serialized) {
      return errorResponse("Artist not found", 404);
    }

    return successResponse(serialized);
  } catch (error) {
    console.error("Artist detail error:", error);
    return errorResponse("Internal server error", 500);
  }
}
