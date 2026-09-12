import { NextRequest, NextResponse } from "next/server";
import { prisma as prismaClient } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const ipLimited = checkRateLimit(`reset-password:ip:${ip}`, 10, 15 * 60 * 1000);
    if (!ipLimited.ok) {
      return NextResponse.json(
        { success: false, error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" },
        { status: 429 }
      );
    }

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ success: false, error: "無効なリクエストです" }, { status: 400 });
    }

    const tokenKey = String(token).trim();
    const tokenLimited = checkRateLimit(`reset-password:token:${tokenKey}`, 5, 15 * 60 * 1000);
    if (!tokenLimited.ok) {
      return NextResponse.json(
        { success: false, error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" },
        { status: 429 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "パスワードは8文字以上で入力してください" }, { status: 400 });
    }

    // Find valid token
    const resetToken = await prismaClient.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: "有効期限が切れているか、無効なトークンです" }, { status: 400 });
    }

    // Update password
    const hashedPassword = await hashPassword(password);
    await prismaClient.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: hashedPassword },
    });

    // Delete token after use
    await prismaClient.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json({ success: true, message: "パスワードを更新しました" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
