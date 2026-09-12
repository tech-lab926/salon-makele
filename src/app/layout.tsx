import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSiteUrl } from "@/lib/site-url";
import { SEO_DEFAULT_DESCRIPTION_JA, SEO_SITE_NAME_JA } from "@/lib/seo-copy";
import DemoRoleSwitcher from "@/components/ui/DemoRoleSwitcher";
import CookieConsent from "@/components/layout/CookieConsent";
import ScrollToTopOnRouteChange from "@/components/layout/ScrollToTopOnRouteChange";
import AppSessionProvider from "@/components/providers/AppSessionProvider";
import { isDemoAuthEnabledClient } from "@/lib/runtime-flags";
import { Noto_Sans_JP, Noto_Serif_JP, Parisienne } from "next/font/google";
import { Toaster } from "react-hot-toast";

const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-serif-jp",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

const parisienne = Parisienne({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-parisienne",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SEO_SITE_NAME_JA} — アートメイク症例・アーティスト検索`,
    template: `%s | ${SEO_SITE_NAME_JA}`,
  },
  description: SEO_DEFAULT_DESCRIPTION_JA,
  keywords: [
    "アートメイク",
    "眉毛",
    "リップ",
    "アーティスト",
    "症例写真",
    "医療アートメイク",
    "パーマネントメイク",
    "アートメイク 東京",
    "アートメイク 症例",
    "眉毛 アートメイク",
  ],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: SEO_SITE_NAME_JA,
    title: `${SEO_SITE_NAME_JA} — アートメイク症例・アーティスト検索`,
    description: SEO_DEFAULT_DESCRIPTION_JA,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SEO_SITE_NAME_JA} — アートメイク症例・アーティスト検索`,
    description: SEO_DEFAULT_DESCRIPTION_JA,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

/** Lets `env(safe-area-inset-*)` respect device notches/home indicator (footer + sticky promo). */
export const viewport: Viewport = {
  viewportFit: "cover",
};

/** Required for strict CSP + nonces: static/ISR HTML cannot match per-request `script-src` nonces. @see next/docs content-security-policy */
// export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const demoUiEnabled = isDemoAuthEnabledClient();

  return (
    <html lang="ja">
      <body
        className={`${notoSerifJP.variable} ${notoSansJP.variable} ${parisienne.variable} min-h-screen bg-white antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof Node === 'function' && Node.prototype) {
                const originalRemoveChild = Node.prototype.removeChild;
                Node.prototype.removeChild = function(child) {
                  if (child.parentNode !== this) {
                    if (console) console.warn('Google Translate Crash Prevented: removeChild', child, this);
                    return child;
                  }
                  return originalRemoveChild.apply(this, arguments);
                };
        
                const originalInsertBefore = Node.prototype.insertBefore;
                Node.prototype.insertBefore = function(newNode, referenceNode) {
                  if (referenceNode && referenceNode.parentNode !== this) {
                    if (console) console.warn('Google Translate Crash Prevented: insertBefore', referenceNode, this);
                    return newNode;
                  }
                  return originalInsertBefore.apply(this, arguments);
                };
              }
            `,
          }}
        />
        <ScrollToTopOnRouteChange />
        <AppSessionProvider>{children}</AppSessionProvider>
        <CookieConsent />
        <Toaster position="top-center" />
        {demoUiEnabled ? <DemoRoleSwitcher /> : null}
      </body>
    </html>
  );
}
