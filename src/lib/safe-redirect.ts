/** Allow only same-origin relative paths after OAuth (avoid open redirects). */
export function sanitizeAppPath(nextParam: string | null | undefined, fallback = "/"): string {
  if (!nextParam) return fallback;
  // Block protocol-relative URLs: // or URL-encoded equivalent /%2F or %2F%2F
  const decoded = decodeURIComponent(nextParam);
  // Browsers normalize \ to / in URLs. We must block \ to prevent path traversal redirects like /\evil.com
  if (
    !nextParam.startsWith("/") ||
    nextParam.startsWith("//") ||
    decoded.startsWith("//") ||
    nextParam.includes("\\") ||
    decoded.includes("\\")
  ) {
    return fallback;
  }
  // Block paths that contain a protocol (e.g. after normalization /http:/evil.com)
  if (/^\/[a-z][a-z+.\-]*:/i.test(decoded)) return fallback;
  return nextParam;
}
