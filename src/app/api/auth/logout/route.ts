import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.session
        .deleteMany({ where: { tokenHash } })
        .catch(() => {});
    }

    const isProduction = process.env.NODE_ENV === "production";
    const clearOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
      maxAge: 0,
    };
    cookieStore.set("access_token", "", clearOpts);
    cookieStore.set("refresh_token", "", clearOpts);

    return successResponse({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse("Internal server error", 500);
  }
}
