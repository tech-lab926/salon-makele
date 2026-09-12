import { absoluteUrl, getSiteUrl } from "@/lib/site-url";
import { SEO_SITE_NAME_JA } from "@/lib/seo-copy";
import { cookies, headers } from "next/headers";

interface JsonLdProps {
  data: Record<string, unknown>;
}

/** Prevent `</script>` in user-controlled JSON from breaking out of the script tag. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  ).replace(/</g, "\\u003c");
}

/**
 * Match Next.js `getScriptNonceFromHeader` so our inline JSON-LD uses the same nonce as framework scripts.
 * @see next/dist/server/app-render/get-script-nonce-from-header.js
 */
function getScriptNonceFromCspHeader(cspHeaderValue: string | null): string | undefined {
  if (!cspHeaderValue) return undefined;
  const directives = cspHeaderValue.split(";").map((d) => d.trim());
  const directive =
    directives.find((dir) => dir.startsWith("script-src")) ||
    directives.find((dir) => dir.startsWith("default-src"));
  if (!directive) return undefined;
  const source = directive
    .split(" ")
    .slice(1)
    .map((s) => s.trim())
    .find((s) => s.startsWith("'nonce-") && s.length > 8 && s.endsWith("'"));
  if (!source) return undefined;
  return source.slice(7, -1);
}

function resolveNonce(h: Headers, cookieNonce: string | undefined): string | undefined {
  const fromCustom = h.get("x-nonce")?.trim() || "";
  if (fromCustom) return fromCustom;
  const fromCsp = getScriptNonceFromCspHeader(h.get("content-security-policy"))?.trim() || "";
  if (fromCsp) return fromCsp;
  const fromCookie = cookieNonce?.trim() || "";
  return fromCookie || undefined;
}

export default async function JsonLd({ data }: JsonLdProps) {
  const h = await headers();
  const cookieStore = await cookies();
  const nonce = resolveNonce(h, cookieStore.get("csp_nonce")?.value);
  return (
    <script
      type="application/ld+json"
      // @ts-ignore-next-line nonce is allowed on script
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}

export function artistJsonLd(artist: {
  name: string;
  area: string;
  bio?: string | null;
  imageUrl?: string | null;
  id: string;
}) {
  const url = absoluteUrl(`/artists/${artist.id}`);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: artist.name,
    jobTitle: "アートメイクアーティスト",
    description: artist.bio || `${artist.name} — アートメイクアーティスト`,
    image: artist.imageUrl || undefined,
    address: {
      "@type": "PostalAddress",
      addressRegion: artist.area,
      addressCountry: "JP",
    },
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export function caseStudyJsonLd(caseData: {
  title: string;
  description: string;
  category: string;
  artistName: string;
  beforeImg: string;
  afterImg: string;
  datePublished: string;
  dateModified?: string;
  id: string;
}) {
  const url = absoluteUrl(`/cases/${caseData.id}`);
  const images = [caseData.beforeImg, caseData.afterImg].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "@id": url,
    name: caseData.title,
    inLanguage: "ja-JP",
    description: caseData.description.slice(0, 160),
    specialty: {
      "@type": "MedicalSpecialty",
      name: caseData.category,
    },
    author: {
      "@type": "Person",
      name: caseData.artistName,
    },
    image: images,
    datePublished: caseData.datePublished,
    dateModified: caseData.dateModified || caseData.datePublished,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: SEO_SITE_NAME_JA,
      url: `${getSiteUrl()}/`,
    },
  };
}

export function blogArticleJsonLd(blog: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  thumbnailUrl?: string | null;
  slug: string;
}) {
  const site = getSiteUrl();
  const url = absoluteUrl(`/blog/${blog.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    inLanguage: "ja-JP",
    description: blog.description,
    author: {
      "@type": "Person",
      name: blog.author,
    },
    datePublished: blog.datePublished,
    dateModified: blog.dateModified || blog.datePublished,
    image: blog.thumbnailUrl || undefined,
    publisher: {
      "@type": "Organization",
      name: SEO_SITE_NAME_JA,
      url: site,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
}

export function breadcrumbJsonLd(
  items: { name: string; url?: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

export function websiteJsonLd() {
  const url = `${getSiteUrl()}/`;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": url,
    name: SEO_SITE_NAME_JA,
    url,
    inLanguage: "ja-JP",
    description:
      "日本初、医療機関監修のアートメイク症例・アーティスト検索メディア",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  const url = `${getSiteUrl()}/`;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${getSiteUrl()}/#organization`,
    name: SEO_SITE_NAME_JA,
    url,
    description:
      "日本初、医療機関監修のアートメイク症例・アーティスト検索メディア",
  };
}
