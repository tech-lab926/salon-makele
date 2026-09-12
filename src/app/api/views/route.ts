import { NextRequest, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  recordView,
  DEDUP_WINDOW_MS,
  isViewRecentlyBuffered,
  markViewBuffered,
  flushViews,
} from "@/lib/view-buffer";
import { checkRateLimit } from "@/lib/rate-limit";
const BOT_USER_AGENT_REGEX = /bot|spider|crawl|ahrefs|google|bing|yandex|yahoo|baidu|duckduck|semrush|majestic|dotbot|rogerbot|ia_archiver|facebookexternalhit|twitterbot|linkedinbot|slurp|proximic|screaming.?frog|headlesschrome|puppeteer|playwright|selenium|phantomjs|curl|wget|python-requests|httpx|java\/|go-http|axios|node-fetch/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetType, targetId } = body;

    if (!targetType || !targetId) {
      return errorResponse("targetType and targetId are required", 400);
    }

    if (!["artist", "case"].includes(targetType)) {
      return errorResponse("Invalid targetType", 400);
    }

    if (!/^\d+$/.test(String(targetId))) {
      return errorResponse("Invalid targetId", 400);
    }

    const userAgent = request.headers.get("user-agent")?.toLowerCase() || "";
    const isBot = !userAgent || BOT_USER_AGENT_REGEX.test(userAgent);
    if (isBot) {
      return successResponse({ counted: false });
    }

    const authUser = await getAuthUser();
    const cookieSessionKey = request.cookies.get("session_key")?.value;

    if (!authUser && !cookieSessionKey?.trim()) {
      return successResponse({ counted: false });
    }

    const rateKey = authUser
      ? `views:user:${authUser.userId}`
      : `views:session:${cookieSessionKey!.slice(0, 64)}`;
    const limited = checkRateLimit(rateKey, 200, 60_000);
    if (!limited.ok) {
      return successResponse({ counted: false });
    }

    const sessionKey = cookieSessionKey!;

    const viewerKey = authUser ? `user:${authUser.userId}` : `session:${sessionKey}`;

    if (isViewRecentlyBuffered(viewerKey, targetType, targetId)) {
      return successResponse({ counted: false });
    }

    const windowStart = new Date(Date.now() - DEDUP_WINDOW_MS);
    const targetBigInt = BigInt(targetId);

    const existing = await prisma.viewHistory.findFirst({
      where: {
        targetType,
        targetId: targetBigInt,
        viewedAt: { gte: windowStart },
        ...(authUser
          ? { userId: BigInt(authUser.userId) }
          : { sessionKey: sessionKey.slice(0, 64), userId: null }),
      },
      select: { id: true },
    });

    if (existing) {
      markViewBuffered(viewerKey, targetType, targetId);
      return successResponse({ counted: false });
    }

    const counted = recordView(targetType, targetId, viewerKey);

    if (counted) {
      // Record history in background using after to prevent blocking but guarantee execution in serverless
      after(() => {
        prisma.viewHistory.create({
          data: {
            userId: authUser ? BigInt(authUser.userId) : null,
            sessionKey: authUser ? null : sessionKey.slice(0, 64),
            targetType,
            targetId: targetBigInt,
          },
        }).catch((err: any) => console.error("ViewHistory create background error:", err));
      });

      // In serverless, we must trigger flushViews immediately inside after to avoid losing the counts
      const isServerless = !!(
        process.env.VERCEL ||
        process.env.AWS_LAMBDA_FUNCTION_NAME ||
        process.env.NETLIFY
      );
      if (isServerless) {
        after(() => {
          flushViews().catch((err: any) =>
            console.error("Serverless flushViews error:", err)
          );
        });
      }
    }

    return successResponse({ counted });
  } catch (error) {
    console.error("View recording error:", error);
    return successResponse({ counted: false });
  }
}
