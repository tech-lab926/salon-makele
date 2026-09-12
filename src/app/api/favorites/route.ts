import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ favorites: [] });
    }

    const url = new URL(req.url);
    const targetType = url.searchParams.get("targetType");
    
    const where: any = { userId: BigInt((session.user as any).id) };
    if (targetType) where.targetType = targetType;

    const favorites = await prisma.favorite.findMany({
      where,
      select: { targetId: true, targetType: true }
    });

    const formatted = favorites.map((f: any) => ({
      targetId: f.targetId.toString(),
      targetType: f.targetType,
    }));

    return NextResponse.json({ favorites: formatted });
  } catch (error) {
    console.error("Fetch favorites error:", error);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    }

    const body = await req.json();
    const { targetType, targetId } = body;

    if (!targetType || !targetId) {
      return NextResponse.json({ error: "無効なリクエストです" }, { status: 400 });
    }

    const userId = BigInt((session.user as any).id);
    const id = BigInt(targetId);

    // Toggle logic: Check if favorite already exists
    const existing = await prisma.favorite.findUnique({
      where: {
        uq_favorite_user_target: {
          userId,
          targetType,
          targetId: id,
        },
      },
    });

    if (existing) {
      // Remove favorite
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ favorited: false });
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          userId,
          targetType,
          targetId: id,
        },
      });
      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error("Favorite toggle error:", error);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
