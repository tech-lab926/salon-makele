import type { MetadataRoute } from "next";
import { SEO_DEFAULT_DESCRIPTION_JA, SEO_SITE_NAME_JA } from "@/lib/seo-copy";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SEO_SITE_NAME_JA} — アートメイク症例・アーティスト検索`,
    short_name: "MAKELE",
    description: SEO_DEFAULT_DESCRIPTION_JA,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#c2185b",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
