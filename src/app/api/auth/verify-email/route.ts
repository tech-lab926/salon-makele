import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

async function verifyWithToken(token: string) {
  const verification = await prisma.emailVerification.findFirst({
    where: {
      token,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!verification) {
    return errorResponse(
      "無効または期限切れのトークンです。再度登録してください。",
      400,
    );
  }

  await prisma.$transaction([
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { verifiedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true },
    }),
  ]);

  if (verification.user.role === "ARTIST") {
    const artistRow = await prisma.artist.findUnique({
      where: { userId: verification.userId },
      select: { id: true },
    });
    if (artistRow) {
      const { grantEarlyRegistrationTrial } = await import("@/lib/subscription");
      await grantEarlyRegistrationTrial(artistRow.id).catch((e: any) =>
        console.error("Failed to grant early registration trial after verify:", e),
      );
    }
  }

  return successResponse({ message: "メールアドレスの確認が完了しました" });
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limitCheck = checkRateLimit(`verify-email:${ip}`, 5, 60 * 60 * 1000);
    if (!limitCheck.ok) {
      return errorResponse("認証の試行回数が上限に達しました。しばらく待ってから再度お試しください。", 429);
    }

    let token: string | null = null;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      token = typeof body.token === "string" ? body.token : null;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      const v = form.get("token");
      token = typeof v === "string" ? v : null;
    }

    if (!token?.trim()) {
      return errorResponse("トークンが必要です", 400);
    }

    return verifyWithToken(token.trim());
  } catch (error) {
    console.error("Email verification error:", error);
    return errorResponse("Internal server error", 500);
  }
}

/** GET verification is disabled to avoid prefetch / log leakage; use POST. */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error:
        "このエンドポイントは POST のみ対応です。確認ページから再度お試しください。",
    },
    { status: 405, headers: { Allow: "POST" } },
  );
}
