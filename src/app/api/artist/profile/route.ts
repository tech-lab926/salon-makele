import { NextRequest } from "next/server";
import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";

const getCachedAreasForProfile = unstable_cache(
  async () => {
    const areas = await prisma.area.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, prefecture: true },
    });
    return areas.map((a: any) => ({ ...a, id: a.id.toString() }));
  },
  ["artist-profile-areas-v1"],
  { revalidate: 3600 },
);

const getCachedCategoriesForProfile = unstable_cache(
  async () => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    });
    return categories.map((c: any) => ({ ...c, id: c.id.toString() }));
  },
  ["artist-profile-categories-v1"],
  { revalidate: 3600 },
);

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "artist") {
      return errorResponse("Unauthorized", 401);
    }

    if (!/^\d+$/.test(user.userId)) {
      return errorResponse("Invalid user ID", 401);
    }
    const userId = user.userId;

    const artist = await prisma.artist.findFirst({
      where: { userId: BigInt(userId), deletedAt: null },
      include: {
        area: true,
        skills: { include: { category: true }, orderBy: { sortOrder: "asc" } },
      },
    });

    if (!artist) return errorResponse("Artist profile not found", 404);

    const [areas, categories] = await Promise.all([
      getCachedAreasForProfile(),
      getCachedCategoriesForProfile(),
    ]);

    return successResponse({
      id: artist.id.toString(),
      displayName: artist.displayName,
      bio: artist.bio,
      clinicName: artist.clinicName,
      clinicAddress: artist.clinicAddress,
      businessHours: artist.businessHours,
      instagramUrl: artist.instagramUrl,
      twitterUrl: artist.twitterUrl,
      lineUrl: artist.lineUrl,
      yearsOfExperience: artist.yearsOfExperience,
      areaId: artist.areaId.toString(),
      profileImgUrl: artist.profileImgUrl,
      medicalLicenseUrl: artist.medicalLicenseUrl,
      artmakeDiplomaUrl: artist.artmakeDiplomaUrl,
      registrationStatus: artist.registrationStatus,
      isPublished: artist.isPublished,
      skills: artist.skills.map((s: any) => s.categoryId.toString()),
      areas: areas.map((a: any) => ({ id: a.id.toString(), prefecture: a.prefecture })),
      categories: categories.map((c: any) => ({ id: c.id.toString(), name: c.name })),
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "artist") {
      return errorResponse("Unauthorized", 401);
    }

    // Rate limit: prevents profile-update spam.
    const profileLimit = checkRateLimit(`profile-put:${user.userId}`, 20, 60_000);
    if (!profileLimit.ok) {
      return errorResponse("プロフィールの更新遣信が多すぎます。少し待ってから再試行してください。", 429);
    }

    const body = await request.json();

    // --- Server-side input length caps ---
    // These mirror the DB schema VarChar lengths and produce clean 400s instead of Postgres errors.
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim().slice(0, 100) : undefined;
    if (displayName !== undefined && displayName.length === 0) {
      return errorResponse("表示名は1文字以上入力してください", 400);
    }

    const bio =
      body.bio !== undefined
        ? typeof body.bio === "string"
          ? body.bio.trim().slice(0, 5000)
          : null
        : undefined;

    const profileImgUrl =
      body.profileImgUrl !== undefined
        ? typeof body.profileImgUrl === "string"
          ? body.profileImgUrl.slice(0, 500)
          : null
        : undefined;

    const clinicName = body.clinicName !== undefined ? (typeof body.clinicName === "string" ? body.clinicName.trim().slice(0, 100) : null) : undefined;
    const clinicAddress = body.clinicAddress !== undefined ? (typeof body.clinicAddress === "string" ? body.clinicAddress.trim().slice(0, 255) : null) : undefined;
    const businessHours = body.businessHours !== undefined ? (typeof body.businessHours === "string" ? body.businessHours.trim().slice(0, 255) : null) : undefined;
    const yearsOfExperience = body.yearsOfExperience !== undefined ? (typeof body.yearsOfExperience === "number" ? body.yearsOfExperience : null) : undefined;
    const instagramUrl = body.instagramUrl !== undefined ? (typeof body.instagramUrl === "string" ? body.instagramUrl.trim().slice(0, 255) : null) : undefined;
    const twitterUrl = body.twitterUrl !== undefined ? (typeof body.twitterUrl === "string" ? body.twitterUrl.trim().slice(0, 255) : null) : undefined;
    const lineUrl = body.lineUrl !== undefined ? (typeof body.lineUrl === "string" ? body.lineUrl.trim().slice(0, 255) : null) : undefined;

    const { areaId, skills } = body;

    const artist = await prisma.artist.findFirst({
      where: { userId: BigInt(user.userId), deletedAt: null },
    });

    if (!artist) return errorResponse("Artist profile not found", 404);

    await prisma.$transaction(async (tx: any) => {
      await tx.artist.update({
        where: { id: artist.id },
        data: {
          displayName: displayName || artist.displayName,
          bio: bio ?? artist.bio,
          clinicName: clinicName !== undefined ? clinicName : artist.clinicName,
          clinicAddress: clinicAddress !== undefined ? clinicAddress : artist.clinicAddress,
          businessHours: businessHours !== undefined ? businessHours : artist.businessHours,
          instagramUrl: instagramUrl !== undefined ? instagramUrl : artist.instagramUrl,
          twitterUrl: twitterUrl !== undefined ? twitterUrl : artist.twitterUrl,
          lineUrl: lineUrl !== undefined ? lineUrl : artist.lineUrl,
          yearsOfExperience: yearsOfExperience !== undefined ? yearsOfExperience : artist.yearsOfExperience,
          areaId: (areaId && /^\d+$/.test(String(areaId))) ? BigInt(areaId) : artist.areaId,
          profileImgUrl: profileImgUrl !== undefined ? profileImgUrl : artist.profileImgUrl,
        },
      });

      if (Array.isArray(skills)) {
        const cappedSkills = skills.slice(0, 20);
        await tx.artistSkill.deleteMany({ where: { artistId: artist.id } });
        if (cappedSkills.length > 0) {
          await tx.artistSkill.createMany({
            data: cappedSkills.filter((id: any) => /^\d+$/.test(String(id))).map((categoryId: string, i: number) => ({
              artistId: artist.id,
              categoryId: BigInt(categoryId),
              sortOrder: i,
            })),
          });
        }
      }
    });

    (revalidateTag as any)("artists");
    (revalidateTag as any)(`artist-${artist.id}`);
    (revalidatePath as any)("/");

    return successResponse({ message: "Profile updated" });
  } catch (error) {
    console.error("Profile PUT error:", error);
    return errorResponse("Internal server error", 500);
  }
}
