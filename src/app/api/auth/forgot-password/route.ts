import { NextRequest, NextResponse, after } from "next/server";
import { prisma as prismaClient } from "@/lib/prisma";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import crypto from "crypto";
import { getSiteUrl } from "@/lib/site-url";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const ipLimited = checkRateLimit(`forgot-password:ip:${ip}`, 5, 15 * 60 * 1000);
    if (!ipLimited.ok) {
      return NextResponse.json(
        { success: false, error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" },
        { status: 429 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "メールアドレスを入力してください" }, { status: 400 });
    }

    const emailKey = email.toLowerCase().trim();
    const emailLimited = checkRateLimit(`forgot-password:email:${emailKey}`, 3, 15 * 60 * 1000);
    if (!emailLimited.ok) {
      return NextResponse.json(
        { success: false, error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" },
        { status: 429 }
      );
    }

    const user = await prismaClient.user.findUnique({
      where: { email: emailKey },
    });

    // Security: Do not reveal if user exists or not
    if (!user) {
      return NextResponse.json({ success: true, message: "リセットリンクを送信しました（該当する場合）" });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Save token
    await prismaClient.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send email
    const siteUrl = getSiteUrl();
    const resetUrl = `${siteUrl}/reset-password?token=${token}`;
    const { subject, html } = passwordResetEmail(user.name, resetUrl);

    // Send password reset email in the background using after to prevent freezing in serverless and preserve timing attack immunity
    after(() => {
      sendEmail({
        to: user.email,
        subject,
        html,
      }).catch((err) => {
        console.error("Failed to send password reset email in background:", err);
      });
    });

    return NextResponse.json({ success: true, message: "リセットリンクを送信しました" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
