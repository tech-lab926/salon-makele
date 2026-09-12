function parseBool(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function isDemoAuthEnabledServer(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return parseBool(process.env.ENABLE_DEMO_AUTH);
}

export function isDemoAuthEnabledClient(): boolean {
  return parseBool(process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH);
}

export function isMockUiEnabledClient(): boolean {
  return parseBool(process.env.NEXT_PUBLIC_USE_MOCK_UI);
}

export function shouldUseMockPrismaServer(): boolean {
  if (parseBool(process.env.USE_MOCK_PRISMA)) return true;
  return !process.env.DATABASE_URL;
}

/** Show “Continue with Google” when server env is configured (set after Google Cloud + NextAuth secrets). */
export function isGoogleSignInEnabledClient(): boolean {
  return parseBool(process.env.NEXT_PUBLIC_GOOGLE_SIGNIN_ENABLED);
}
