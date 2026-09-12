import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  normalizeRole,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
} from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";

async function mergeAnonymousHistory(userId: bigint, sessionKey: string) {
  try {
    await prisma.viewHistory.updateMany({
      where: { sessionKey, userId: null },
      data: { userId, sessionKey: null },
    });
  } catch {
    // non-critical, ignore
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const ipLimited = checkRateLimit(`login:ip:${ip}`, 30, 15 * 60 * 1000);
    if (!ipLimited.ok) {
      return errorResponse("Too many login attempts. Try again later.", 429);
    }

    const body = await request.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return errorResponse(result.error.issues[0]?.message || "Validation failed", 400);
    }
    const { email, password } = result.data;

    // Per-email limit: prevents distributed credential-stuffing against a single account.
    const emailLimited = checkRateLimit(`login:email:${email.toLowerCase()}`, 5, 15 * 60 * 1000);
    if (!emailLimited.ok) {
      return errorResponse("Too many login attempts. Try again later.", 429);
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Dummy bcrypt hash to mitigate timing attacks for user enumeration
    // Uses a correctly formatted 60-character bcrypt hash to ensure parsing does not fast-fail.
    // $2a$10$ followed by 22 chars of valid base64 salt (./A-Za-z0-9) and 31 chars of hash
    const dummyHash = "$2a$10$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";
    const hashToCompare = user && !user.deletedAt && user.passwordHash ? user.passwordHash : dummyHash;

    const isValid = await comparePassword(password, hashToCompare).catch(() => false);

    if (!user || user.deletedAt || !isValid) {
      return errorResponse("Invalid email or password", 401);
    }

    if (!user.emailVerified) {
      return errorResponse(
        "Please verify your email before signing in. Check your inbox for the confirmation link.",
        403,
      );
    }

    const normalizedRole = normalizeRole(user.role);
    const payload = { userId: user.id.toString(), role: normalizedRole };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const tokenHash = hashToken(refreshToken);

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_EXPIRES_IN * 1000),
      },
    });

    const cookieStore = await cookies();

    cookieStore.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_EXPIRES_IN,
    });

    cookieStore.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_EXPIRES_IN,
    });

    const sessionKey = request.cookies.get("session_key")?.value;
    if (sessionKey) {
      mergeAnonymousHistory(user.id, sessionKey);
    }

    return successResponse({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: normalizedRole,
    });
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Internal server error", 500);
  }
}
