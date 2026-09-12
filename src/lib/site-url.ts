/**
 * Canonical public site origin (must match `metadataBase` in root layout).
 * Used for JSON-LD, breadcrumbs, and any absolute URLs when env is unset (e.g. local dev).
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }
  return "https://makele.jp";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return `${base}/`;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Use for Open Graph / JSON-LD when URLs may be site-relative or absolute. */
export function absoluteAssetUrl(url: string): string {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return absoluteUrl(url.startsWith("/") ? url : `/${url}`);
}
