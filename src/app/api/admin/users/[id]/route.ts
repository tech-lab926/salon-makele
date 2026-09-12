import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";

function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, serializeBigInt(value)]),
    );
  }
  return obj;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    
    if (!id || isNaN(Number(id))) {
      return errorResponse("Invalid ID", 400);
    }

    const userDetail = await prisma.user.findUnique({
      where: { id: BigInt(id) },
      include: {
        _count: {
          select: {
            bookings: true,
            reviews: true,
            favorites: true,
          },
        },
        artist: {
          select: {
            id: true,
            displayName: true,
            registrationStatus: true,
            isPublished: true,
            clinicName: true,
            createdAt: true,
            _count: {
              select: { bookings: true }
            }
          }
        }
      },
    });

    if (!userDetail) {
      return errorResponse("User not found", 404);
    }

    return successResponse(serializeBigInt(userDetail));
  } catch (error) {
    console.error("Admin user detail GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}
