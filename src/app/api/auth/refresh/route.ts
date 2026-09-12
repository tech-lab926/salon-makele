import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  normalizeRole,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "No refresh token" },
        { status: 401 },
      );
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid refresh token" },
        { status: 401 },
      );
    }

    const tokenHash = hashToken(refreshToken);
    const session = await prisma.session.findFirst({
      where: { tokenHash, userId: BigInt(payload.userId) },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      return NextResponse.json(
        { success: false, error: "Session expired or revoked" },
        { status: 401 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(payload.userId) },
      select: { role: true, deletedAt: true, emailVerified: true },
    });

    if (!dbUser || dbUser.deletedAt || !dbUser.emailVerified) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return NextResponse.json(
        { success: false, error: "Session expired or revoked" },
        { status: 401 },
      );
    }

    await prisma.session.delete({ where: { id: session.id } });

    const newPayload = {
      userId: payload.userId,
      role: normalizeRole(dbUser.role),
    };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);
    const newTokenHash = hashToken(newRefreshToken);

    await prisma.session.create({
      data: {
        userId: BigInt(payload.userId),
        tokenHash: newTokenHash,
        expiresAt: new Date(Date.now() + REFRESH_EXPIRES_IN * 1000),
      },
    });

    const isProduction = process.env.NODE_ENV === "production";

    const response = NextResponse.json({ success: true, data: { refreshed: true } });

    response.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_EXPIRES_IN,
    });

    response.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_EXPIRES_IN,
    });

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
