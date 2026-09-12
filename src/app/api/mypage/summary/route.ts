import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma, isMockPrisma } from "@/lib/prisma";

type FavoriteItem = {
  id: string;
  title: string;
  beforeImgUrl: string | null;
  afterImgUrl: string | null;
  category: { name: string };
  artist: { id: string; displayName: string; profileImgUrl: string | null };
};

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Authentication required", 401);

    if (!/^\d+$/.test(user.userId)) {
      return errorResponse("Invalid user id", 401);
    }

    if (isMockPrisma) {
      return successResponse({
        favorites: [
          {
            id: "mock1",
            title: "ふんわりナチュラル眉",
            beforeImgUrl: null,
            afterImgUrl:
              "https://images.unsplash.com/photo-1594465919760-441fe5908a0c?w=500&q=80",
            category: { name: "眉毛" },
            artist: { id: "1", displayName: "Aoi Sato", profileImgUrl: null },
          },
          {
            id: "mock2",
            title: "血色感アップ リップアート",
            beforeImgUrl: null,
            afterImgUrl:
              "https://images.unsplash.com/photo-1588514528148-18eaf3d420ec?w=500&q=80",
            category: { name: "リップ" },
            artist: { id: "2", displayName: "Yui Tanaka", profileImgUrl: null },
          },
        ],
        points: {
          balance: 1500,
          history: [
            { id: 1, action: "予約来店ポイント", points: 500, date: "2026/04/01" },
            { id: 2, action: "新規登録キャンペーン", points: 1000, date: "2026/03/15" },
          ],
        },
        coupons: [
          { id: 1, title: "初回限定10%OFF", expire: "2026/12/31", status: "未使用" },
          { id: 2, title: "お友達紹介クーポン", expire: "2026/05/31", status: "未使用" },
        ],
      });
    }

    const userId = BigInt(user.userId);
    const favoriteRows = await prisma.favorite.findMany({
      where: {
        userId,
        targetType: 'case',
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { targetId: true },
    });

    const favoriteCaseIds = favoriteRows.map((row: any) => row.targetId);

    const favoriteCases = favoriteCaseIds.length
      ? await prisma.case.findMany({
          where: {
            id: { in: favoriteCaseIds },
            isPublished: true,
            deletedAt: null,
          },
          select: {
            id: true,
            title: true,
            beforeImgUrl: true,
            afterImgUrl: true,
            category: { select: { name: true } },
            artist: {
              select: { id: true, displayName: true, profileImgUrl: true },
            },
          },
        })
      : [];

    const favoriteCaseMap = new Map<string, any>(
      favoriteCases.map((c: any) => [c.id.toString(), c])
    );
    const favorites: FavoriteItem[] = favoriteCaseIds
      .map((id: any) => favoriteCaseMap.get(id.toString()))
      .filter((row: any): row is NonNullable<any> => Boolean(row))
      .map((item: any) => ({
        id: item.id.toString(),
        title: item.title,
        beforeImgUrl: item.beforeImgUrl,
        afterImgUrl: item.afterImgUrl,
        category: { name: item.category.name },
        artist: {
          id: item.artist.id.toString(),
          displayName: item.artist.displayName,
          profileImgUrl: item.artist.profileImgUrl,
        },
      }));

    return successResponse({
      favorites,
      points: { balance: 0, history: [] },
      coupons: [],
    });
  } catch (error) {
    console.error("Mypage summary error:", error);
    return errorResponse("Internal server error", 500);
  }
}
