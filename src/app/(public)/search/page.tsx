import { Suspense } from "react";
import type { Metadata } from "next";
import SearchContent from "@/components/search/SearchContent";
import { SEO_SITE_NAME_JA } from "@/lib/seo-copy";

const title = "検索";
const description =
  "アートメイクの症例・アーティストをカテゴリ、エリア、キーワードで横断検索。理想の施術やアーティストを見つけましょう。";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["検索", "アートメイク", "症例", "アーティスト", "カテゴリ", "エリア", SEO_SITE_NAME_JA],
  alternates: { canonical: "/search" },
  openGraph: {
    title: `${title} | ${SEO_SITE_NAME_JA}`,
    description,
    url: "/search",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | ${SEO_SITE_NAME_JA}`,
    description,
  },
};

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
