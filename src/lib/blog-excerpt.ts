/** Plain-text excerpt for list cards / SEO (no HTML). */
export function excerptFromHtml(html: string, maxLen = 220): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, Math.max(0, maxLen - 1))}…`;
}
