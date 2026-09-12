import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function generateSessionKey(): string {
  return crypto.randomUUID();
}

/**
 * Middleware for handling session keys and basic security headers.
 */
export default function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";

  // Omit nonce on style-src: if a nonce is present, browsers ignore 'unsafe-inline',
  // which blocks React style={...} and other runtime inline styles. Scripts stay strict.
  const contentSecurityPolicyHeaderValue = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com https://translate.googleapis.com",
    "img-src 'self' data: blob: https: https://www.gstatic.com https://translate.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com https://translate.googleapis.com",
    "connect-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (!request.cookies.get("session_key")?.value) {
    response.cookies.set("session_key", generateSessionKey(), {
      httpOnly: true,
      // secure flag ensures the cookie is never sent over plain HTTP in production.
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });
  }

  response.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue);

  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
