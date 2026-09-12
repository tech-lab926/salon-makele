import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/login",
          "/register",
          "/register/artist",
          "/verify-email",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
