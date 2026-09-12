import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser, hashPassword } from "@/lib/auth";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import { getPageRange } from "@/lib/utils";
import { ADMIN_ITEMS_PER_PAGE } from "@/constants";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { getSiteUrl } from "@/lib/site-url";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const ip = clientIp(request);
    const limitCheck = checkRateLimit(`admin-api:${user.userId}:${ip}`, 100, 60_000);
    if (!limitCheck.ok) {
      return errorResponse("リクエストが多すぎます。しばらく待ってから再度お試しください。", 429);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || ADMIN_ITEMS_PER_PAGE),
    );
    const { skip, take } = getPageRange(page, limit);

    const where = { deletedAt: null };

    const [artists, total] = await Promise.all([
      prisma.artist.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          user: { select: { email: true } },
          area: { select: { prefecture: true } },
          skills: {
            orderBy: { sortOrder: "asc" },
            take: 24,
            include: { category: { select: { name: true } } },
          },
          _count: { select: { cases: true, bookings: true, skills: true } },
        },
      }),
      prisma.artist.count({ where }),
    ]);

    const cleaned = artists.map((a: any) => ({
      id: a.id.toString(),
      displayName: a.displayName,
      email: a.user.email,
      area: a.area.prefecture,
      isPublished: a.isPublished,
      registrationStatus: a.registrationStatus,
      medicalLicenseUrl: a.medicalLicenseUrl,
      artmakeDiplomaUrl: a.artmakeDiplomaUrl,
      caseCount: a._count.cases,
      bookingCount: a._count.bookings,
      skills: a.skills.map((s: any) => s.category.name),
      skillCount: a._count.skills,
      createdAt: a.createdAt.toISOString(),
    }));

    return paginatedResponse(cleaned, Number(total), page, limit, { skipSerialization: true });
  } catch (error) {
    console.error("Admin artists GET error:", error);
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
    const {
      email,
      password,
      displayName,
      bio,
      areaId,
      profileImgUrl,
      isPublished,
      skillCategoryIds,
    } = body;

    if (!email || !password || !displayName || !areaId) {
      return errorResponse("Email, password, display name, and area are required", 400);
    }

    const trimmedDisplayName = displayName.trim().slice(0, 100);
    if (!trimmedDisplayName) {
      return errorResponse("Display name is required", 400);
    }
    const trimmedBio = bio && typeof bio === "string" ? bio.trim().slice(0, 5000) : null;
    const trimmedProfileImgUrl = profileImgUrl && typeof profileImgUrl === "string" ? profileImgUrl.trim().slice(0, 500) : null;

    if (password.length < 8) {
      return errorResponse("Password must be at least 8 characters", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse("Email already registered", 409);
    }

    const passwordHash = await hashPassword(password);

    const createdArtist = await prisma.$transaction(async (tx: any) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: displayName,
          role: "ARTIST",
          emailVerified: true,
        },
      });

      const validatedAreaId = (areaId && /^\d+$/.test(String(areaId))) ? BigInt(areaId) : null;
      if (validatedAreaId === null) throw new Error("INVALID_AREA_ID");

      const artist = await tx.artist.create({
        data: {
          userId: createdUser.id,
          displayName: trimmedDisplayName,
          bio: trimmedBio,
          areaId: validatedAreaId,
          profileImgUrl: trimmedProfileImgUrl,
          isPublished: Boolean(isPublished),
        },
      });

      if (Array.isArray(skillCategoryIds) && skillCategoryIds.length > 0) {
        const validSkillIds = skillCategoryIds
          .filter((id: any) => /^\d+$/.test(String(id)))
          .map((id: any) => BigInt(id));
          
        if (validSkillIds.length > 0) {
          await tx.artistSkill.createMany({
            data: validSkillIds.map((categoryId: bigint, index: number) => ({
              artistId: artist.id,
              categoryId,
              sortOrder: index,
            })),
          });
        }
      }

      return artist;
    });

    const { grantEarlyRegistrationTrial } = await import("@/lib/subscription");
    await grantEarlyRegistrationTrial(createdArtist.id).catch((e: any) => {
      console.error("Failed to grant early registration trial", e);
    });

    return successResponse({ id: createdArtist.id.toString() }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_AREA_ID") {
      return errorResponse("Invalid area ID", 400);
    }
    console.error("Admin artists POST error:", error);
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
    const { id, isPublished, registrationStatus } = body;

    if (!id || !/^\d+$/.test(String(id))) return errorResponse("Artist ID is required", 400);
    const artistId = BigInt(id);

    const updateData: any = {};

    // Enforce business rule: cannot publish an artist with no skills.
    if (isPublished !== undefined) {
      if (isPublished) {
        const skillCount = await prisma.artistSkill.count({ where: { artistId } });
        if (skillCount === 0) {
          return errorResponse("公開するには少なくとも1つの施術カテゴリ（スキル）の登録が必要です", 400);
        }
      }
      updateData.isPublished = isPublished;
    }

    if (registrationStatus !== undefined) {
      updateData.registrationStatus = registrationStatus;
    }

    const updatedArtist = await prisma.artist.update({
      where: { id: artistId },
      data: updateData,
      include: { user: true }
    });

    if (registrationStatus === "APPROVED") {
      const appUrl = getSiteUrl();
      const { artistApprovalEmail } = await import("@/lib/email");
      const emailContent = artistApprovalEmail(updatedArtist.user.name || updatedArtist.displayName, `${appUrl}/login`);
      await sendEmail({ to: updatedArtist.user.email, ...emailContent }).catch(err => {
        console.error("Failed to send approval email:", err);
      });
    }

    revalidatePath("/artists");
    revalidatePath("/");
    revalidatePath(`/artists/${id}`);

    return successResponse({ message: "Artist updated" });
  } catch (error) {
    console.error("Admin artists PATCH error:", error);
    return errorResponse("Internal server error", 500);
  }
}
