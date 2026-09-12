import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";
import { isDemoAuthEnabledServer } from "@/lib/runtime-flags";

export async function POST(request: NextRequest) {
  try {
    if (!isDemoAuthEnabledServer()) {
      return errorResponse("Demo auth is disabled", 404);
    }

    const { role } = await request.json();

    if (!["admin", "artist", "user"].includes(role)) {
      return errorResponse("Invalid role", 400);
    }

    const cookieStore = await cookies();

    // Set the demo role cookie
    cookieStore.set("demo_role", role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    // Clear real tokens just in case to avoid identity mismatch
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");

    let redirectUrl = "/";
    if (role === "admin") redirectUrl = "/admin";
    else if (role === "artist") redirectUrl = "/dashboard";

    return successResponse({
      redirectUrl,
      role
    });
  } catch (error) {
    console.error("Demo login error:", error);
    return errorResponse("Internal server error", 500);
  }
}
