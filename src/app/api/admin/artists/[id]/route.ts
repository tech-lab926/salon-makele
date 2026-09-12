import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    if (!/^\d+$/.test(id)) return errorResponse("Invalid artist ID", 400);
    const artist = await prisma.artist.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: { select: { email: true, name: true } },
        area: true,
        skills: { include: { category: true } },
      },
    });

    if (!artist) return errorResponse("Artist not found", 404);

    return successResponse({
      id: artist.id.toString(),
      userId: artist.userId.toString(),
      displayName: artist.displayName,
      bio: artist.bio,
      areaId: artist.areaId.toString(),
      profileImgUrl: artist.profileImgUrl,
      medicalLicenseUrl: artist.medicalLicenseUrl,
      artmakeDiplomaUrl: artist.artmakeDiplomaUrl,
      clinicName: artist.clinicName,
      clinicAddress: artist.clinicAddress,
      businessHours: artist.businessHours,
      yearsOfExperience: artist.yearsOfExperience,
      registrationStatus: artist.registrationStatus,
      isPublished: artist.isPublished,
      isSponsored: artist.isSponsored,
      priorityRank: artist.priorityRank,
      email: artist.user.email,
      instagramUrl: artist.instagramUrl,
      twitterUrl: artist.twitterUrl,
      lineUrl: artist.lineUrl,
      skillCategoryIds: artist.skills.map((s: any) => s.categoryId.toString()),
    });
  } catch (error) {
    console.error("Admin artist GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(
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
    const { displayName, bio, areaId, profileImgUrl, isPublished, isSponsored, priorityRank, skillCategoryIds, registrationStatus, clinicName, clinicAddress, businessHours, yearsOfExperience, instagramUrl, twitterUrl, lineUrl } = body;

    const trimmedDisplayName = displayName && typeof displayName === "string" ? displayName.trim().slice(0, 100) : undefined;
    const trimmedBio = bio !== undefined ? (typeof bio === "string" ? bio.trim().slice(0, 5000) : null) : undefined;
    const trimmedProfileImgUrl = profileImgUrl !== undefined ? (typeof profileImgUrl === "string" ? profileImgUrl.trim().slice(0, 500) : null) : undefined;
    const cleanInstagramUrl = instagramUrl !== undefined ? (typeof instagramUrl === "string" ? instagramUrl.trim().slice(0, 255) : null) : undefined;
    const cleanTwitterUrl = twitterUrl !== undefined ? (typeof twitterUrl === "string" ? twitterUrl.trim().slice(0, 255) : null) : undefined;
    const cleanLineUrl = lineUrl !== undefined ? (typeof lineUrl === "string" ? lineUrl.trim().slice(0, 255) : null) : undefined;

    if (!/^\d+$/.test(id)) return errorResponse("Invalid artist ID", 400);
    const artistId = BigInt(id);
    const existing = await prisma.artist.findUnique({
      where: { id: artistId },
      include: { 
        _count: { select: { skills: true } },
        user: { select: { email: true, name: true } }
      },
    });
    if (!existing) return errorResponse("Artist not found", 404);

    const skillCountAfter = Array.isArray(skillCategoryIds)
      ? skillCategoryIds.length
      : existing._count.skills;
    const nextPublished =
      isPublished !== undefined ? Boolean(isPublished) : existing.isPublished;
    if (nextPublished && skillCountAfter === 0) {
      return errorResponse(
        "公開するには少なくとも1つの施術カテゴリ（スキル）の登録が必要です",
        400,
      );
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.artist.update({
        where: { id: artistId },
        data: {
          displayName: trimmedDisplayName !== undefined ? (trimmedDisplayName || undefined) : undefined,
          bio: trimmedBio !== undefined ? trimmedBio : undefined,
          areaId: (areaId && /^\d+$/.test(String(areaId))) ? BigInt(areaId) : undefined,
          profileImgUrl: trimmedProfileImgUrl !== undefined ? trimmedProfileImgUrl : undefined,
          isPublished: isPublished !== undefined ? isPublished : undefined,
          isSponsored: isSponsored !== undefined ? Boolean(isSponsored) : undefined,
          priorityRank: priorityRank !== undefined ? Number(priorityRank) : undefined,
          registrationStatus: registrationStatus !== undefined ? registrationStatus : undefined,
          clinicName: clinicName !== undefined ? clinicName : undefined,
          clinicAddress: clinicAddress !== undefined ? clinicAddress : undefined,
          businessHours: businessHours !== undefined ? businessHours : undefined,
          instagramUrl: cleanInstagramUrl !== undefined ? cleanInstagramUrl : undefined,
          twitterUrl: cleanTwitterUrl !== undefined ? cleanTwitterUrl : undefined,
          lineUrl: cleanLineUrl !== undefined ? cleanLineUrl : undefined,
          yearsOfExperience: yearsOfExperience !== undefined ? (yearsOfExperience === "" ? null : Number(yearsOfExperience)) : undefined,
        },
      });

      if (Array.isArray(skillCategoryIds)) {
        await tx.artistSkill.deleteMany({ where: { artistId: artistId } });
        if (skillCategoryIds.length > 0) {
          await tx.artistSkill.createMany({
            data: skillCategoryIds.filter((cid: any) => /^\d+$/.test(String(cid))).map((cid: string, idx: number) => ({
              artistId: artistId,
              categoryId: BigInt(cid),
              sortOrder: idx,
            })),
          });
        }
      }
    });

    if (registrationStatus === "APPROVED" && existing.registrationStatus !== "APPROVED") {
      const { getSiteUrl } = await import("@/lib/site-url");
      const { sendEmail, artistApprovalEmail } = await import("@/lib/email");
      const appUrl = getSiteUrl();
      const emailContent = artistApprovalEmail(existing.user.name || existing.displayName, `${appUrl}/login`);
      await sendEmail({ to: existing.user.email, ...emailContent }).catch(err => {
        console.error("Failed to send approval email:", err);
      });
    }

    return successResponse({ message: "Artist updated" });
  } catch (error) {
    console.error("Admin artist PUT error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    if (!/^\d+$/.test(id)) return errorResponse("Invalid artist ID", 400);

    const artistId = BigInt(id);

    try {
      await prisma.artist.update({
        where: { id: artistId },
        data: { deletedAt: new Date(), isPublished: false }
      });
    } catch (e: any) {
      if (e.code === 'P2003') {
        return errorResponse("予約や症例が関連付けられているため、削除できません", 400);
      }
      throw e;
    }

    return successResponse({ message: "Artist deleted" });
  } catch (error) {
    console.error("Admin artist DELETE error:", error);
    return errorResponse("Internal server error", 500);
  }
}
