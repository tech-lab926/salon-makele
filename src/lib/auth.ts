import { cache } from "react";
import { getServerSession, NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { cookies } from "next/headers";
import { isDemoAuthEnabledServer } from "@/lib/runtime-flags";

if (!("toJSON" in BigInt.prototype)) {
  Object.defineProperty(BigInt.prototype, "toJSON", {
    get() {
      return function (this: BigInt) {
        return String(this);
      };
    },
  });
}

function isGoogleOAuthConfiguredServer(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim() &&
      process.env.NEXTAUTH_SECRET?.trim(),
  );
}

function serializeBigIntForAdapter(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(serializeBigIntForAdapter);
  if (typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = serializeBigIntForAdapter(obj[key]);
    }
    return newObj;
  }
  return obj;
}

const customPrismaAdapter = PrismaAdapter(prisma);

// Wrap ALL adapter methods to serialize BigInts to Strings,
// because NextAuth internally JSON.stringifies users/accounts and crashes on BigInt.
const adapterMethods = Object.keys(customPrismaAdapter) as (keyof typeof customPrismaAdapter)[];
adapterMethods.forEach((method) => {
  const originalMethod = customPrismaAdapter[method];
  if (typeof originalMethod === "function") {
    // @ts-ignore
    customPrismaAdapter[method] = async (...args: any[]) => {
      const result = await (originalMethod as any)(...args);
      return serializeBigIntForAdapter(result);
    };
  }
});

const originalCreateUser = customPrismaAdapter.createUser;
if (originalCreateUser) {
  customPrismaAdapter.createUser = async (data: any) => {
    // Avoid Prisma error: NextAuth passes `emailVerified: null` by default,
    // but our schema defines it as a non-null Boolean!
    // @ts-ignore
    if (data.emailVerified === null) {
      // @ts-ignore
      delete data.emailVerified;
    }
    return originalCreateUser(data);
  };
}

export const authOptions: NextAuthOptions = {
  adapter: customPrismaAdapter,
  providers: [
    ...(isGoogleOAuthConfiguredServer()
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
              params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code",
                // We MUST request photoslibrary.readonly scope here so that the
                // issued access_token has permission to call the Google Photos API.
                scope: "openid email profile https://www.googleapis.com/auth/photospicker.mediaitems.readonly",
              },
            },
            // NOTE: We are enabling allowDangerousEmailAccountLinking so artists 
            // can link their Google Photos to their existing email/password account.
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user?.id) return;
      try {
        await prisma.user.update({
          where: { id: BigInt(String(user.id)) },
          data: { emailVerified: true },
        });

        // NextAuth doesn't automatically update existing account tokens on login.
        // We must manually overwrite the old access_token so the new scopes are saved!
        if (account.access_token && account.providerAccountId) {
          await prisma.account.updateMany({
            where: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
            data: {
              access_token: account.access_token,
              refresh_token: account.refresh_token ?? undefined,
              expires_at: account.expires_at ?? undefined,
              scope: account.scope ?? undefined,
              id_token: account.id_token ?? undefined,
              // @ts-ignore - Some versions of NextAuth types don't include this yet
              refresh_token_expires_in: account.refresh_token_expires_in ?? undefined,
            },
          });
        }
      } catch (err) {
        console.error("Google signIn emailVerified update:", err);
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = String(user.id);
        const dbUser = await prisma.user.findUnique({
          where: { id: BigInt(String(user.id)) },
        });
        token.role = dbUser?.role?.toLowerCase() || "user";
      }
      // Do NOT copy provider access/refresh tokens into the JWT/token object
      // to avoid exposing them via the session endpoint or client-side code.
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // @ts-ignore
        session.user.id = token.userId;
        // @ts-ignore
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export interface JwtPayload {
  userId: string;
  role: "user" | "artist" | "admin";
}

export function normalizeRole(role: string): JwtPayload["role"] {
  const normalized = role.toLowerCase();
  if (normalized === "artist" || normalized === "admin") {
    return normalized as JwtPayload["role"];
  }
  return "user";
}

export const ACCESS_EXPIRES_IN = 15 * 60; // 15 minutes
export const REFRESH_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days

function getJwtSecret(): string {
  const secret =
    process.env.JWT_SECRET ?? (process.env.NODE_ENV !== "production" ? "dev-jwt-secret" : "");
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return secret;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: ACCESS_EXPIRES_IN, algorithm: "HS256" });
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: REFRESH_EXPIRES_IN, algorithm: "HS256" });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as JwtPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash?: string | null): Promise<boolean> {
  if (!hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

export const getAuthUser = cache(async (): Promise<JwtPayload | null> => {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return {
        // @ts-ignore
        userId: session.user.id,
        // @ts-ignore
        role: session.user.role as JwtPayload["role"],
      };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        return {
          userId: decoded.userId,
          role: decoded.role,
        };
      } catch (err) {
        // invalid token
      }
    }

    // Demo fallback is opt-in to avoid masking real auth integration issues.
    if (isDemoAuthEnabledServer()) {
      if (process.env.NODE_ENV === "production") {
        // Hard-fail if demo auth is accidentally enabled in production.
        return null;
      }
      const demoRole = cookieStore.get("demo_role")?.value;

      if (demoRole === "admin") return { userId: "1", role: "admin" };
      if (demoRole === "artist") return { userId: "2", role: "artist" };
      if (demoRole === "user") return { userId: "3", role: "user" };
    }

    return null;
  } catch (e) {
    console.error("Auth error:", e);
    return null;
  }
});
