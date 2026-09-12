export function register() {
  /** REQUIREMENTS §8: DB / business dates align with Asia/Tokyo on the VPS. */
  if (process.env.NODE_ENV === "production" && !process.env.TZ?.trim()) {
    process.env.TZ = "Asia/Tokyo";
  }

  // JWT secret validation disabled for frontend-only demo mode
  // Re-enable when connecting to a real backend
}
