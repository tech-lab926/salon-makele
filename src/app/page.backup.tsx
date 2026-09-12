import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Search, Shield, ShieldPlus, Plus, MapPin, ArrowRight, ImageIcon, LayoutDashboard, Crown, Heart, ChevronRight, ChevronDown, Gem, MessageSquare, Star, Sparkles, CalendarCheck2, BadgeCheck } from "lucide-react";
import JsonLd, { websiteJsonLd, organizationJsonLd } from "@/components/seo/JsonLd";
import PhotoGrid from "@/components/ui/PhotoGrid";
import { SEO_DEFAULT_DESCRIPTION_JA, SEO_SITE_NAME_JA } from "@/lib/seo-copy";
import FeaturedArticles from "@/components/home/FeaturedArticles";
import CategoryCaseSection from "@/components/home/CategoryCaseSection";
import ArtistPremiumCard from "@/components/home/ArtistPremiumCard";
import PopularArtistsSection from "@/components/home/PopularArtistsSection";
import { prisma, isMockPrisma } from "@/lib/prisma";
import { artistPopularOrderBy } from "@/lib/list-order";
import { Prisma } from "@prisma/client";

const HOME_TITLE = `${SEO_SITE_NAME_JA} — アートメイク症例・アーティスト検索`;

/** One class for all three headings so TSX can’t drift; tight leading + geometric hint helps JP Mincho look even across lengths. */
const HOME_FEATURE_CARD_TITLE_CLASS =
  "text-[18px] font-bold leading-snug text-[#c2185b] [font-family:'Hiragino_Mincho_ProN','Noto_Serif_JP',serif] [text-rendering:geometricPrecision]";

const HOME_FEATURE_CARD_DESC_CLASS =
  "mt-1.5 text-[13px] font-medium leading-snug text-[#7a6b70] md:mt-0";

/** Names / short labels in the md+ three-column row — stepped sizes (768 narrowest columns; rating stacks there so names can stay readable). */
const HOME_FEATURE_COMPACT_LABEL_CLASS =
  "text-[13px] font-medium leading-tight md:text-[11px] md:leading-tight min-[820px]:text-[12px] min-[820px]:leading-snug lg:text-[12px]";

/** Dividers between the 3 feature cards: mobile = centered horizontal rule (~90% width); md+ = vertical rail inset from top/bottom (same #f2c8d2). */
const HOME_FEATURE_COLUMN_RAIL_CLASS =
  "after:pointer-events-none after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-[90%] after:-translate-x-1/2 after:rounded-full after:bg-[#f2c8d2] after:content-[''] md:after:right-0 md:after:top-[5%] md:after:bottom-[5%] md:after:left-auto md:after:h-auto md:after:w-[2px] md:after:max-w-none md:after:translate-x-0";

const ARTIST_CTA_BACKGROUND_IMAGE =
  "https://dkctzvsdslydq.cloudfront.net/c/f=webp:auto,w=3840,through=auto,ir=auto/_next/static/media/dl_bg.939d30c9.jpg";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: SEO_DEFAULT_DESCRIPTION_JA,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: HOME_TITLE,
    description: SEO_DEFAULT_DESCRIPTION_JA,
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: SEO_DEFAULT_DESCRIPTION_JA,
  },
};
type ArtistApiItem = {
  id: string;
  displayName: string;
  bio: string | null;
  profileImgUrl: string | null;
  viewCount: number;
  area: { id: string; prefecture: string; city: string | null };
  skills: { id: string; name: string; slug: string }[];
  caseCount: number;
  menus: { id: string; name: string; price: number | null }[];
  cases: { id: string; title: string; afterImgUrl: string }[];
};

type CaseApiItem = {
  id: string;
  title: string;
  afterImgUrl: string;
  category: { id: string; name: string; slug: string };
  artist: { id: string; displayName: string; profileImgUrl: string | null };
};

type CategoryApiItem = { id: string; name: string; slug: string; caseCount: number };
type AreaApiItem = { id: string; prefecture: string; city: string | null; _count: { artists: number } };
type BlogApiItem = { id: string; title: string; slug: string; excerpt: string | null; thumbnailUrl: string | null; publishedAt: string | null };

async function fetchArtistsPopular() {
  const artists = await prisma.artist.findMany({
    where: { isPublished: true, deletedAt: null },
    orderBy: artistPopularOrderBy,
    take: 6,
    include: {
      area: true,
      skills: {
        orderBy: { sortOrder: "asc" },
        take: 12,
        include: { category: true },
      },
      menus: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        take: 2,
        select: { id: true, name: true, price: true },
      },
      cases: {
        where: { isPublished: true, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 2,
        select: { id: true, title: true, afterImgUrl: true },
      },
      _count: { select: { cases: true } },
    },
  });

  return artists.map((artist: any) => ({
    id: artist.id.toString(),
    displayName: artist.displayName,
    bio: artist.bio,
    profileImgUrl: artist.profileImgUrl,
    viewCount: Number(artist.viewCount),
    area: {
      id: artist.area.id.toString(),
      prefecture: artist.area.prefecture,
      city: artist.area.city,
    },
    skills: artist.skills.map((skill: any) => ({
      id: skill.category.id.toString(),
      name: skill.category.name,
      slug: skill.category.slug,
    })),
    caseCount: artist._count.cases,
    menus: artist.menus.map((menu: any) => ({
      id: menu.id.toString(),
      name: menu.name,
      price: menu.price,
    })),
    cases: artist.cases.map((item: any) => ({
      id: item.id.toString(),
      title: item.title,
      afterImgUrl: item.afterImgUrl,
    })),
  })) as ArtistApiItem[];
}

async function fetchCategoriesSummary() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { cases: true } },
    },
  });

  return categories.map((category: any) => ({
    id: category.id.toString(),
    name: category.name,
    slug: category.slug,
    caseCount: category._count.cases,
  })) as CategoryApiItem[];
}

async function fetchAreas() {
  const areas = await prisma.area.findMany({
    where: { artists: { some: { isPublished: true, deletedAt: null } } },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { artists: true } } },
  });

  return areas.map((area: any) => ({
    id: area.id.toString(),
    prefecture: area.prefecture,
    city: area.city,
    _count: { artists: area._count.artists },
  })) as AreaApiItem[];
}

async function fetchBlogs() {
  const blogs = await prisma.blog.findMany({
    where: { isPublished: true, publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take: 4,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      thumbnailUrl: true,
      publishedAt: true,
    },
  });

  return blogs.map((blog: any) => ({
    id: blog.id.toString(),
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt?.trim() || null,
    thumbnailUrl: blog.thumbnailUrl,
    publishedAt: blog.publishedAt?.toISOString() || null,
  })) as BlogApiItem[];
}

async function fetchCategoryCases(categorySlug: string) {
  const cases = await prisma.case.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
      category: { slug: categorySlug },
      artist: { isPublished: true, deletedAt: null },
    },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: {
      id: true,
      title: true,
      afterImgUrl: true,
      artist: {
        select: {
          id: true,
          displayName: true,
          profileImgUrl: true,
          area: { select: { id: true, prefecture: true, city: true } },
        },
      },
      category: { select: { id: true, name: true, slug: true } },
    },
  });

  return cases.map((item: any) => ({
    id: item.id.toString(),
    title: item.title,
    afterImgUrl: item.afterImgUrl,
    artist: {
      id: item.artist.id.toString(),
      displayName: item.artist.displayName,
      profileImgUrl: item.artist.profileImgUrl,
    },
    category: {
      id: item.category.id.toString(),
      name: item.category.name,
      slug: item.category.slug,
    },
  })) as CaseApiItem[];
}

async function fetchTopCasesForHomeCategories(
  topCategories: CategoryApiItem[],
): Promise<CaseApiItem[][]> {
  if (topCategories.length === 0) return [];

  if (isMockPrisma) {
    return Promise.all(topCategories.map((cat: any) => fetchCategoryCases(cat.slug)));
  }

  const slugs = topCategories.map((c: any) => c.slug);
  const rows = (await (prisma as any).$queryRaw(Prisma.sql`
    WITH ranked AS (
      SELECT
        c.id,
        c.title,
        c.after_img_url,
        c.category_id,
        cat.id AS cat_id,
        cat.name AS cat_name,
        cat.slug AS cat_slug,
        a.id AS artist_id,
        a.display_name,
        a.profile_img_url,
        ROW_NUMBER() OVER (PARTITION BY c.category_id ORDER BY c.created_at DESC) AS rn
      FROM cases c
      INNER JOIN artists a ON c.artist_id = a.id
      INNER JOIN categories cat ON c.category_id = cat.id
      WHERE c.is_published = true
        AND c.deleted_at IS NULL
        AND a.is_published = true
        AND a.deleted_at IS NULL
        AND cat.slug IN (${Prisma.join(slugs)})
    )
    SELECT
      id,
      title,
      after_img_url,
      cat_id,
      cat_name,
      cat_slug,
      artist_id,
      display_name,
      profile_img_url
    FROM ranked WHERE rn <= 3
  `)) as Array<{
    id: bigint;
    title: string;
    after_img_url: string;
    cat_id: bigint;
    cat_name: string;
    cat_slug: string;
    artist_id: bigint;
    display_name: string;
    profile_img_url: string | null;
  }>;

  const bySlug = new Map<string, CaseApiItem[]>();
  for (const slug of slugs) bySlug.set(slug, []);

  for (const row of rows) {
    const item: CaseApiItem = {
      id: row.id.toString(),
      title: row.title,
      afterImgUrl: row.after_img_url,
      category: {
        id: row.cat_id.toString(),
        name: row.cat_name,
        slug: row.cat_slug,
      },
      artist: {
        id: row.artist_id.toString(),
        displayName: row.display_name,
        profileImgUrl: row.profile_img_url,
      },
    };
    const list = bySlug.get(row.cat_slug) ?? [];
    list.push(item);
    bySlug.set(row.cat_slug, list);
  }

  return slugs.map((slug: any) => bySlug.get(slug) ?? []);
}

async function loadHomePageData() {
  try {
    const [popularArtistsRaw, categories, areas, blogs] = await Promise.all([
      fetchArtistsPopular(),
      fetchCategoriesSummary(),
      fetchAreas(),
      fetchBlogs(),
    ]);

    const popularArtists = popularArtistsRaw.map((artist: any) => ({
      id: artist.id,
      displayName: artist.displayName,
      profileImgUrl: artist.profileImgUrl,
      bio: artist.bio,
      area: artist.area,
      skills: artist.skills.map((s: any) => ({ category: { name: s.name } })),
      menus: artist.menus,
      cases: artist.cases,
      stats: { rating: 0, reviewCount: 0, likeCount: 0 },
    }));

    const topCategories = categories.slice(0, 4);
    const casesPerCategory = await fetchTopCasesForHomeCategories(topCategories);

    const categoriesWithCases = topCategories.map((category: any, idx: number) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sortOrder: 0,
      isActive: true,
      cases: (casesPerCategory[idx] ?? []).map((item: any) => ({
        id: item.id,
        title: item.title,
        afterImgUrl: item.afterImgUrl,
        categoryId: item.category.id,
        artist: {
          id: item.artist.id,
          displayName: item.artist.displayName,
          profileImgUrl: item.artist.profileImgUrl,
          area: { prefecture: "", city: null },
        },
      })),
    }));

    const serializedAreas = areas.map((area: any) => ({
      id: area.id,
      prefecture: area.prefecture,
      city: area.city,
      sortOrder: 0,
      _count: { artists: area._count.artists },
    }));

    const serializedBlogs = blogs.map((blog: any) => ({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      thumbnailUrl: blog.thumbnailUrl,
      publishedAt: blog.publishedAt,
    }));

    return [popularArtists, categoriesWithCases, serializedAreas, serializedBlogs] as const;
  } catch (error) {
    console.error("Data fetch error:", error);
    return [[], [], [], []] as const;
  }
}

/** Cross-request cache — homepage stays dynamically rendered for CSP nonces, but Prisma work is amortized. */
const getHomePageData = unstable_cache(loadHomePageData, ["home-page-prisma"], {
  revalidate: 60,
});

export default async function HomePage() {
  const [popularArtists, categoriesWithCases, areas, blogs] = await getHomePageData();

  const topAreas = areas.filter((a) => a._count.artists > 0);

  return (
    <>
      <Header />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={organizationJsonLd()} />
      <main>
        {/* Hero */}
        <section className="relative bg-[#e9d2df] pt-0 lg:bg-white">
          <div className="relative overflow-hidden">
            {/* Full-width Background Breakout — warmer pink on mobile / stacked layout */}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#f4e6ec_0%,#e9d2df_100%)] lg:hidden" aria-hidden />
            <div className="absolute inset-0 hidden bg-[linear-gradient(180deg,#f9f5f6_0%,#f3ecef_100%)] lg:block" aria-hidden />

            <div className="relative mx-auto w-full max-w-[calc(1000px+4rem)] px-0 sm:px-6 lg:px-8">
              <div className="relative">

              <div className="relative z-10 grid min-h-0 lg:grid-cols-[minmax(0,_248px)_minmax(0,_1fr)] lg:items-start lg:gap-x-7 2xl:grid-cols-[minmax(0,_264px)_minmax(0,_1fr)] 2xl:gap-x-8 min-[1800px]:grid-cols-[minmax(0,_280px)_minmax(0,_1fr)] min-[1800px]:gap-x-9 lg:pb-6">
                <div className="relative z-20 flex min-w-0 max-lg:items-center flex-col items-start overflow-visible pb-4 px-4 pt-3 text-left sm:pb-8 sm:px-9 sm:pt-7 lg:items-start lg:pb-10 lg:pl-4 lg:pr-7 lg:pt-6 2xl:pl-5 2xl:pr-8 min-[1800px]:pl-6 min-[1800px]:pr-8">
                  <div className="flex flex-col items-center self-center lg:self-start">
                    <div className="relative mt-0 inline-flex items-center justify-center sm:mt-2">
                      {/* Left Ribbon Tail (Pink) */}
                      <div className="absolute -left-4 bottom-[-2px] -z-10 h-4 w-[1.65rem] origin-top-right rotate-[-9deg] bg-[#e87a9b]" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 30% 50%, 0 0)' }}></div>
                      {/* Left Fold */}
                      <div className="absolute left-0 bottom-0 -z-20 h-1 w-1 bg-[#ab3f62]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}></div>

                      {/* Right Ribbon Tail (Salmon/Orange) */}
                      <div className="absolute -right-4 bottom-[-2px] -z-10 h-4 w-[1.65rem] origin-top-left rotate-[9deg] bg-[#f8a594]" style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%, 70% 50%, 100% 0)' }}></div>
                      {/* Right Fold */}
                      <div className="absolute right-0 bottom-0 -z-20 h-1 w-1 bg-[#ab3f62]" style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}></div>

                      <div className="relative z-10 flex items-center gap-2.5 rounded-[6px] border border-[#d487a0] bg-[linear-gradient(110deg,#fffdf9_0%,#fff5ee_100%)] px-4 py-2 shadow-[0_12px_30px_rgba(193,73,111,0.14)] sm:gap-3.5 sm:px-7 sm:py-3">
                        <div className="relative flex h-[36px] w-[36px] items-center justify-center text-[#a82b3a] sm:h-[40px] sm:w-[40px]">
                          <Shield className="absolute inset-0 h-full w-full stroke-[0.8]" />
                          {/* Sharp, Square Bold Plus Sign */}
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="square" strokeLinejoin="miter" className="relative z-10 pt-0.5">
                            <path d="M12 5V19M5 12H19" />
                          </svg>
                        </div>

                        <div className="flex flex-col">
                          <h2 className="text-[20px] sm:text-[23px] lg:text-[17px] 2xl:text-[18px] min-[1800px]:text-[19px] leading-none font-bold tracking-[0.06em] text-[#b84a6e] [font-family:'Hiragino_Mincho_ProN','Noto_Serif_JP',serif]">
                            医療機関監修
                          </h2>
                          <p className="mt-1.5 text-[10px] leading-none font-medium tracking-[0.04em] text-[#7d6a72] [font-family:'Hiragino_Kaku_Gothic_ProN','Yu_Gothic','Noto_Sans_JP',sans-serif] sm:text-[11px] lg:text-[9px] 2xl:text-[9px] min-[1800px]:text-[10px]">
                            専門医監修のもと、安心・安全な情報を提供
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 inline-flex w-fit flex-col items-center sm:mt-5 lg:mt-5 2xl:mt-6">
                      <div className="relative">
                        <p className="text-[50px] sm:text-[60px] lg:text-[44px] 2xl:text-[50px] min-[1800px]:text-[56px] leading-[0.9] tracking-[0.2em] font-medium text-[#c4567a] [font-family:'Hiragino_Mincho_ProN','Noto_Serif_JP',serif]">
                          MAKELE
                        </p>
                      </div>
                      <div className="mt-1.5 flex flex-col items-center text-center text-[#c4567a]">
                        <p className="text-[22px] sm:text-[26px] lg:text-[18px] 2xl:text-[22px] min-[1800px]:text-[24px] leading-none font-medium tracking-[0.15em] [font-family:'Hiragino_Mincho_ProN','Noto_Serif_JP',serif]">
                          メイクル
                        </p>
                        <p className="mt-3 sm:mt-4 text-[14px] sm:text-[16px] lg:text-[12px] 2xl:text-[14px] min-[1800px]:text-[15px] font-medium tracking-[0.15em] text-[#7a6b70] [font-family:'Hiragino_Kaku_Gothic_ProN','Yu_Gothic','Noto_Sans_JP',sans-serif]">
                          アートメイクアーティスト検索
                        </p>
                      </div>
                    </div>
                  </div>

                  <h1 className="relative z-30 mt-3 max-w-[620px] min-w-0 self-center text-[clamp(1.35rem,4.6vw,1.65rem)] sm:mt-5 sm:text-[clamp(1.6rem,1.9vw,2.8rem)] lg:max-w-none lg:w-full lg:self-start lg:mt-6 lg:text-[clamp(0.98rem,1.05vw,1.55rem)] 2xl:mt-7 2xl:text-[clamp(1.02rem,1.1vw,1.65rem)] min-[1800px]:text-[clamp(1.05rem,1.08vw,1.62rem)] leading-[1.18] tracking-[-0.03em] text-[#3c3337] [font-family:'Yu_Mincho','Hiragino_Mincho_ProN','Noto_Serif_JP',serif]">
                    <span className="block">
                      あなたにぴったりの
                      <br />
                      <span className="whitespace-nowrap">アートメイクアーティストを</span>
                    </span>
                    <span className="mt-[0.12em] block text-[#d36f90]">探そう</span>
                  </h1>

                  <div className="mt-4 flex w-fit max-w-full flex-wrap justify-center gap-x-1.5 gap-y-1.5 self-center [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-5 sm:gap-x-2 sm:gap-y-2 lg:mt-5 lg:w-auto lg:max-w-none lg:flex-nowrap lg:justify-start lg:gap-x-1.5 lg:gap-y-0 lg:self-start 2xl:mt-6 2xl:gap-x-2.5 min-[1800px]:gap-x-3 lg:pl-1">
                    {(
                      [
                        { icon: MapPin, lines: ["エリアから", "探せる"] as const },
                        { icon: Crown, lines: ["人気アーティスト", "が見つかる"] as const, nowrapFirstLine: true },
                        { icon: Heart, lines: ["症例や口コミで", "比較できる"] as const },
                      ] as const
                    ).map((item) => (
                      <div
                        key={item.lines.join("·")}
                        className="flex h-[5.875rem] w-[5.875rem] shrink-0 flex-col items-center justify-center rounded-full border border-[#ead9df] bg-white/88 px-1 py-1 text-center shadow-[0_8px_18px_rgba(194,24,91,0.07)] sm:h-24 sm:w-24 sm:px-1.5 sm:py-1 md:h-[6.25rem] md:w-[6.25rem] md:px-1.5 md:py-1 lg:h-[80px] lg:w-[80px] lg:shrink-0 lg:px-1 lg:py-1 lg:shadow-[0_10px_20px_rgba(194,24,91,0.06)] 2xl:h-[86px] 2xl:w-[86px] min-[1800px]:h-[108px] min-[1800px]:w-[108px] min-[1800px]:py-1.5"
                      >
                        <item.icon className="h-6 w-6 shrink-0 sm:h-7 sm:w-7 md:h-6 md:w-6 lg:h-5 lg:w-5 2xl:h-5 2xl:w-5 min-[1800px]:h-8 min-[1800px]:w-8 text-[#c78296]" strokeWidth={1.75} />
                        <span className="mt-1 max-w-full text-[11px] leading-[1.2] tracking-tight sm:leading-[1.22] md:text-[11px] md:leading-[1.22] lg:mt-0.5 lg:text-[9px] lg:leading-[1.25] 2xl:text-[9.5px] min-[1800px]:mt-1.5 min-[1800px]:text-[12px] min-[1800px]:leading-[1.35] font-medium text-[#75676d]">
                          {item.lines.map((line: any, i: number) => (
                            <span
                              key={i}
                              className={
                                i === 0 && "nowrapFirstLine" in item && item.nowrapFirstLine
                                  ? "block whitespace-nowrap"
                                  : "block"
                              }
                            >
                              {line}
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 w-full max-lg:min-h-[220px] max-lg:aspect-[16/11] lg:aspect-auto lg:min-h-[443px] lg:w-[98%] lg:max-w-[98%] lg:justify-self-end lg:pr-6 2xl:min-h-[468px] min-[1800px]:min-h-[490px]">
                  <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_45%_24%,rgba(255,248,250,0.42),rgba(245,236,241,0.1)_48%,rgba(245,236,241,0)_76%)] lg:block" aria-hidden />
                  <Image
                    src="/demo/banners/hero_banner_ai.png"
                    alt="Four women illustration"
                    fill
                    priority
                    sizes="(min-width: 1800px) 704px, (min-width: 1024px) 56vw, 100vw"
                    className="max-lg:object-contain max-lg:object-center lg:object-cover lg:object-[62%_12%] lg:[mask-image:linear-gradient(to_right,transparent_0%,#000_0.75%,#000_99.25%,transparent_100%),linear-gradient(to_top,transparent_0%,#000_0.75%)] lg:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,#000_0.75%,#000_99.25%,transparent_100%),linear-gradient(to_top,transparent_0%,#000_0.75%)] lg:[mask-composite:intersect] lg:[-webkit-mask-composite:destination-in]"
                  />
                  {/* <div className="pointer-events-none absolute right-12 top-[67%] z-[2] -translate-y-1/2 rotate-[-10deg] text-right max-lg:right-[3rem] max-lg:min-[428px]:max-[440px]:right-[4.125rem] sm:max-lg:right-[3.375rem] md:max-lg:right-[11rem] sm:top-[69.25%] md:top-[71.25%] lg:right-[7.5rem] lg:top-[74%] 2xl:right-[8rem]">
                    <p className="font-extralight whitespace-nowrap text-[28px] leading-[1.08] tracking-[-0.008em] max-lg:text-[#fff7fa] sm:text-[28px] md:text-[32px] lg:text-[39px] lg:text-[rgba(238,196,214,0.72)] lg:drop-shadow-none 2xl:text-[43px] min-[1800px]:text-[47px] [font-family:var(--font-parisienne)]">
                      Find your
                    </p>
                    <p className="-mt-1 inline-block max-lg:translate-x-5 translate-x-6 font-extralight whitespace-nowrap text-[50px] leading-[1.04] tracking-[-0.016em] max-lg:text-[#fff5f8] sm:text-[50px] md:text-[58px] lg:text-[66px] lg:text-[rgba(244,206,223,0.7)] lg:drop-shadow-[0_2px_5px_rgba(36,18,28,0.42)] lg:[text-shadow:0_0_2px_rgba(36,18,28,0.55)] lg:[-webkit-text-stroke:0.65px_rgba(52,23,37,0.32)] 2xl:text-[72px] min-[1800px]:text-[78px] [font-family:var(--font-parisienne)]">
                      Artist
                    </p>
                  </div> */}
                </div>
              </div>

              {/* Search Card — overlaps the hero image */}
              <div className="relative z-20 mx-auto w-full max-w-[min(100%,52rem)] px-4 pb-0 sm:px-6 sm:pb-1 lg:px-6 lg:pb-2 -mt-10 sm:-mt-20 lg:-mt-14">
                <div className="rounded-[12px] border border-gray-100/50 bg-white/95 px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:px-5 sm:py-4">
              <form action="/search" className="mx-auto grid w-full max-w-[52rem] gap-2.5 lg:grid-cols-[1fr_1fr_280px] lg:gap-3">
                <div className="relative min-w-0">
                  <select className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-gray-100 bg-white pl-4 pr-10 text-[14px] text-[#62585c] shadow-sm outline-none">
                  <option>エリアを選択</option>
                  <option>東京</option>
                  {areas
                    .filter((a) => a.prefecture !== "東京都")
                    .slice(0, 4)
                    .map((area: any) => (
                      <option key={area.id} value={area.id}>
                        {area.prefecture}
                      </option>
                    ))}
                </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a707f]" aria-hidden />
                </div>

                <div className="relative min-w-0">
                  <select className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-gray-100 bg-white pl-4 pr-10 text-[14px] text-[#62585c] shadow-sm outline-none">
                  <option>施術メニューを選択</option>
                  <option>すべて</option>
                  {categoriesWithCases.map((cat: any) => (
                    <option key={cat.id.toString()} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a707f]" aria-hidden />
                </div>

                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#df6a95] to-[#c2185b] px-6 text-[15px] font-semibold text-white shadow-sm transition hover:brightness-105"
                >
                  <Search className="h-4 w-4" />
                  アーティストを探す
                </button>
              </form>

              <div className="mx-auto mt-3 flex w-full max-w-[52rem] gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:gap-2.5 sm:overflow-x-visible sm:pb-0 lg:grid-cols-7">
                {[
                  { name: "眉", slug: "eyebrow" },
                  { name: "リップ", slug: "lip" },
                  { name: "アイライン", slug: "eyeliner" },
                  { name: "ヘアライン", slug: "hairline" },
                  { name: "SMP", slug: "smp" },
                  { name: "ほくろ", slug: "mole" },
                  { name: "傷跡修正", slug: "scar-revision" },
                ].map((tag: any) => (
                  <Link
                    key={tag.name}
                    href={`/search?category=${tag.slug}`}
                    className="shrink-0 sm:w-full rounded-full border border-gray-100 bg-white px-3 py-1.5 text-center text-[12px] font-medium text-[#9a707f] shadow-sm transition-all hover:border-[#df6a95] hover:text-[#df6a95] cursor-pointer whitespace-nowrap"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
                </div>
              </div>
              </div>
            </div>
          </div>

          {/* Info Bar — Features Section (styled like original sticky footer) */}
          <div className="w-full bg-[linear-gradient(110deg,#fffdf9_0%,#fff5ee_100%)] py-3 sm:py-4 lg:py-4 border-y border-[#ead9df]/50 shadow-sm">
            <div className="mx-auto flex w-full max-w-[calc(1000px+4rem)] flex-col items-center gap-2 px-3 sm:gap-3 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4 lg:px-8 lg:gap-5">
              {/* Text Section */}
              <div className="flex max-w-full shrink items-center text-center md:min-w-0 md:max-w-[min(100%,26rem)] md:text-left">
                <p className="text-[10px] font-medium leading-snug tracking-wide text-[#4a4a4a] sm:text-[11px] sm:leading-relaxed lg:text-[13px]">
                  アートメイクがもっと身近に、もっと安心に。
                  <br />
                  信頼できるアーティストとの出会いをMAKELEがサポートします。
                </p>
              </div>

              {/* Features Section */}
              <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:flex-nowrap sm:gap-3 md:w-auto md:max-w-none md:shrink-0 md:justify-end lg:gap-4">
                {/* Item 1 */}
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-2.5">
                  <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 sm:h-[36px] sm:w-[36px] lg:h-[40px] lg:w-[40px]">
                    <Gem className="h-[15px] w-[15px] text-[#df7d98] stroke-[1.5] sm:h-[18px] sm:w-[18px] lg:h-[20px] lg:w-[20px]" />
                  </div>
                  <span className="max-w-[7.5rem] text-center text-[10px] font-bold leading-tight tracking-wide text-gray-700 sm:max-w-none sm:whitespace-nowrap sm:text-[11px] lg:text-[12px]">
                    豊富な症例・実績
                  </span>
                </div>

                {/* Divider 1 */}
                <div className="hidden h-6 w-px shrink-0 self-center rounded-full bg-gray-200 sm:block" />

                {/* Item 2 */}
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-2.5">
                  <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 sm:h-[36px] sm:w-[36px] lg:h-[40px] lg:w-[40px]">
                    <MessageSquare className="h-[15px] w-[15px] text-[#df7d98] stroke-[1.5] sm:h-[18px] sm:w-[18px] lg:h-[20px] lg:w-[20px]" />
                  </div>
                  <span className="max-w-[7.5rem] text-center text-[10px] font-bold leading-tight tracking-wide text-gray-700 sm:max-w-none sm:whitespace-nowrap sm:text-[11px] lg:text-[12px]">
                    安心の口コミ・評価
                  </span>
                </div>

                {/* Divider 2 */}
                <div className="hidden h-6 w-px shrink-0 self-center rounded-full bg-gray-200 sm:block" />

                {/* Item 3 */}
                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-2.5">
                  <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 sm:h-[36px] sm:w-[36px] lg:h-[40px] lg:w-[40px]">
                    <Search className="h-[15px] w-[15px] text-[#df7d98] stroke-[1.5] sm:h-[18px] sm:w-[18px] lg:h-[20px] lg:w-[20px]" />
                  </div>
                  <span className="max-w-[7.5rem] text-center text-[10px] font-bold leading-tight tracking-wide text-gray-700 sm:max-w-none sm:whitespace-nowrap sm:text-[11px] lg:text-[12px]">
                    かんたん検索
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards Section — white background area */}
        <section className="bg-white pb-3">
          <div className="relative z-20 mx-auto mt-2 w-full max-w-[calc(1000px+4rem)] px-6 pb-0 max-md:px-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 rounded-2xl border border-gray-100/50 bg-[linear-gradient(180deg,#fff5f8_0%,#fdf2f7_100%)] shadow-[0_8px_30px_rgba(0,0,0,0.04)] md:grid-cols-3 md:grid-rows-[auto_auto_auto_1fr] md:gap-y-2 overflow-hidden">

              {/* Card 1: Popular Eyebrow Feature */}
              <div className={`group relative flex flex-col px-5 pb-3 pt-5 md:col-start-1 md:row-span-4 md:row-start-1 md:grid md:[grid-template-rows:subgrid] md:pb-3 md:px-5 md:pt-5 ${HOME_FEATURE_COLUMN_RAIL_CLASS}`}>
                <h3 className={HOME_FEATURE_CARD_TITLE_CLASS}>
                  今人気の眉アートメイク特集
                </h3>
                <p className={HOME_FEATURE_CARD_DESC_CLASS}>
                  美しい眉の人気アーティストをピックアップ
                </p>
                <div className="relative mt-4 h-[130px] w-full shrink-0 overflow-hidden rounded-xl md:mt-0">
                  <Image
                    src="/demo/cases/case1_after.png"
                    alt="Popular Eyebrow Artmake"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="mt-auto pt-3 md:mt-0 md:w-full md:self-end md:pt-3">
                  <Link href="/blog" className="mx-auto flex w-[70%] items-center justify-center gap-1 rounded-xl border border-gray-100 bg-white py-2 text-[12px] font-medium text-[#3c3337] shadow-sm transition-all hover:bg-gray-50">
                    特集をもっと見る
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 2: Popular Artists — tighter horizontal padding at md so three names have more track width */}
              <div className={`group relative flex flex-col px-5 pb-3 pt-5 md:col-start-2 md:row-span-4 md:row-start-1 md:grid md:[grid-template-rows:subgrid] md:px-3 md:pb-3 md:pt-5 lg:px-5 ${HOME_FEATURE_COLUMN_RAIL_CLASS}`}>
                <h3 className={HOME_FEATURE_CARD_TITLE_CLASS}>
                  人気アーティスト
                </h3>
                <p className={HOME_FEATURE_CARD_DESC_CLASS}>
                  高評価のアーティストをエリア別にご紹介
                </p>
                <div className="mt-4 flex gap-3 px-2 md:mt-0 md:gap-1 md:px-0 lg:gap-3 lg:px-2">
                  {popularArtists.slice(0, 3).map((artist: any, idx: number) => (
                    <div key={idx} className="flex min-w-0 flex-1 flex-col items-center px-0.5 text-center md:px-0">
                      <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-[#fdf0f4] shadow-sm">
                        <Image
                          src={artist.profileImgUrl || "/demo/artists/artist1.png"}
                          alt={artist.displayName}
                          fill
                          className="object-cover"
                         unoptimized={true} />
                      </div>
                      <span
                        className={`mt-2 block w-full max-w-full whitespace-nowrap text-[#3c3337] ${HOME_FEATURE_COMPACT_LABEL_CLASS}`}
                      >
                        {artist.displayName}さん
                      </span>
                      <div className="mt-0.5 flex flex-row items-center justify-center gap-1 text-[12px] leading-none text-[#df6a95] md:flex-col md:gap-0.5 md:py-0 md:leading-tight lg:mt-2 lg:flex-row lg:gap-1 lg:leading-none">
                        <span className="flex items-center gap-0.5 whitespace-nowrap">
                          <Star className="size-3 shrink-0 fill-current" />
                          <span className="font-bold">4.9</span>
                        </span>
                        <span className="whitespace-nowrap font-normal text-[11px] leading-tight text-[#a19298] lg:leading-none">
                          (120件)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-3 md:mt-0 md:w-full md:self-end md:pt-3">
                  <Link href="/artists" className="mx-auto flex w-[70%] items-center justify-center gap-1 rounded-xl border border-gray-100 bg-white py-2 text-[12px] font-medium text-[#3c3337] shadow-sm transition-all hover:bg-gray-50">
                    もっと見る
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Card 3: Case Photos — match Card 2 md horizontal squeeze so labels fit */}
              <div className="group relative flex flex-col px-5 pb-3 pt-5 md:col-start-3 md:row-span-4 md:row-start-1 md:grid md:[grid-template-rows:subgrid] md:border-r-0 md:px-3 md:pb-3 md:pt-5 lg:px-5">
                <h3 className={HOME_FEATURE_CARD_TITLE_CLASS}>
                  症例写真から探す
                </h3>
                <p className={HOME_FEATURE_CARD_DESC_CLASS}>
                  施術部位ごとの症例写真をチェック
                </p>
                <div className="mt-4 grid min-w-0 grid-cols-3 gap-3 px-2 md:mt-0 md:gap-2 md:px-0 lg:gap-3 lg:px-2">
                  {[
                    { img: "/demo/cases/case2_after.png", label: "眉" },
                    { img: "/demo/cases/case3_after.png", label: "リップ" },
                    { img: "/demo/cases/case4_after.png", label: "アイライン" },
                  ].map((caseItem: any, idx: number) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                        <Image
                          src={caseItem.img}
                          alt={caseItem.label}
                          fill
                          className="object-cover"
                         unoptimized={true} />
                      </div>
                      <span
                        className={`mt-1.5 block w-full text-center whitespace-nowrap text-[#7a6b70] ${HOME_FEATURE_COMPACT_LABEL_CLASS}`}
                      >
                        {caseItem.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-3 md:mt-0 md:w-full md:self-end md:pt-3">
                  <Link href="/cases" className="mx-auto flex w-[70%] items-center justify-center gap-1 rounded-xl border border-gray-100 bg-white py-2 text-[12px] font-medium text-[#3c3337] shadow-sm transition-all hover:bg-gray-50">
                    症例をもっと見る
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Bottom Info Bar — COMMENTED OUT — Sticky full-width from `lg` (1024px) only; hidden on phones and tablets (incl. 768 / 820) so content isn't covered. */}
        {/* <div className="hidden lg:block fixed bottom-0 left-0 right-0 z-50 w-full bg-gradient-to-r from-[#eca7bc]/95 via-[#e690a8]/95 to-[#df7d98]/95 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] lg:py-3.5 shadow-[0_-10px_40px_rgba(194,24,91,0.15)] backdrop-blur-md border-t border-white/20 transition-all duration-300"> */}
          {/* <div className="mx-auto flex w-full max-w-[calc(1000px+4rem)] flex-col items-center gap-2.5 px-3 sm:gap-4 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-4 lg:px-8 lg:gap-5"> */}
            {/* <div className="flex max-w-full shrink items-center text-center md:min-w-0 md:max-w-[min(100%,26rem)] md:text-left"> */}
              {/* <p className="text-[10px] font-medium leading-snug tracking-wide text-[#4a4a4a] sm:text-[11px] sm:leading-relaxed lg:text-[13px]"> */}
                {/* アートメイクがもっと身近に、もっと安心に。
                <br />
                信頼できるアーティストとの出会いをMAKELEがサポートします。 */}
              {/* </p> */}
            {/* </div> */}
            {/* <div className="flex w-full min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:flex-nowrap sm:gap-3 md:w-auto md:max-w-none md:shrink-0 md:justify-end lg:gap-4"> */}
              {/* Item 1 */}
              {/* <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-2.5">
                <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 sm:h-[36px] sm:w-[36px] lg:h-[40px] lg:w-[40px]">
                  <Gem className="h-[15px] w-[15px] text-[#df7d98] stroke-[1.5] sm:h-[18px] sm:w-[18px] lg:h-[20px] lg:w-[20px]" />
                </div>
                <span className="max-w-[7.5rem] text-center text-[10px] font-bold leading-tight tracking-wide text-white sm:max-w-none sm:whitespace-nowrap sm:text-[11px] lg:text-[12px]">
                  豊富な症例・実績
                </span>
              </div> */}

              {/* Divider 1 */}
              {/* <div className="hidden h-6 w-px shrink-0 self-center rounded-full bg-white/30 sm:block" /> */}

              {/* Item 2 */}
              {/* <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-2.5">
                <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 sm:h-[36px] sm:w-[36px] lg:h-[40px] lg:w-[40px]">
                  <MessageSquare className="h-[15px] w-[15px] text-[#df7d98] stroke-[1.5] sm:h-[18px] sm:w-[18px] lg:h-[20px] lg:w-[20px]" />
                </div>
                <span className="max-w-[7.5rem] text-center text-[10px] font-bold leading-tight tracking-wide text-white sm:max-w-none sm:whitespace-nowrap sm:text-[11px] lg:text-[12px]">
                  安心の口コミ・評価
                </span>
              </div> */}

              {/* Divider 2 */}
              {/* <div className="hidden h-6 w-px shrink-0 self-center rounded-full bg-white/30 sm:block" /> */}

              {/* Item 3 */}
              {/* <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-2.5">
                <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-105 sm:h-[36px] sm:w-[36px] lg:h-[40px] lg:w-[40px]">
                  <Search className="h-[15px] w-[15px] text-[#df7d98] stroke-[1.5] sm:h-[18px] sm:w-[18px] lg:h-[20px] lg:w-[20px]" />
                </div>
                <span className="max-w-[7.5rem] text-center text-[10px] font-bold leading-tight tracking-wide text-white sm:max-w-none sm:whitespace-nowrap sm:text-[11px] lg:text-[12px]">
                  かんたん検索
                </span>
              </div> */}

        {/* Featured Articles */}
        <FeaturedArticles blogs={[...blogs]} />

        {/* Category-Divided New Cases */}
        {categoriesWithCases
          .filter(cat => cat.cases.length > 0)
          .map((cat: any) => (
            <CategoryCaseSection
              key={cat.id.toString()}
              categoryName={cat.name}
              categoryId={cat.id.toString()}
              cases={cat.cases as any}
            />
          ))}

        {popularArtists.length > 0 && <PopularArtistsSection artists={popularArtists} />}

        {/* Area Navigation — same width shell as category / 開催中の特集 / 人気アーティスト */}
        {topAreas.length > 0 && (
          <section className="bg-white pt-5 sm:pt-6 lg:pt-8 pb-12 sm:pb-14 lg:pb-16">
            <div className="mx-auto max-w-[calc(1000px+4rem)] px-4 sm:px-6 lg:px-8">
              <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">エリアから探す</h2>
                <p className="mt-1 text-sm text-gray-500">お近くのアーティストを見つけましょう</p>

                <div className="mt-5 sm:mt-6 flex flex-wrap gap-3">
                  {topAreas.map((area: any) => (
                    <Link
                      key={area.id.toString()}
                      href={`/artists?areaId=${area.id}`}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-pink-200 hover:bg-pink-50 hover:text-[#c2185b]"
                    >
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {area.prefecture}{area.city ? ` ${area.city}` : ""}
                      <span className="text-xs text-gray-400">
                        ({area._count.artists})
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* メイクルの３つの特徴 */}
        <section className="bg-white pt-10 sm:pt-12 lg:pt-14 pb-10 sm:pb-12 lg:pb-14">
          <div className="mx-auto max-w-[calc(1000px+4rem)] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full">
              <h2 className="text-2xl sm:text-3xl lg:text-2xl font-bold text-center text-[#3c3337] mb-2">
                メイクルの３つの特徴
              </h2>
              <div className="mx-auto grid max-w-[940px] grid-cols-1 gap-6 sm:gap-8 mt-6 md:grid-cols-3 md:justify-items-center">
                {/* Feature 1 */}
                <div className="flex w-full max-w-[280px] flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 mb-4">
                    <Gem className="h-8 w-8 text-[#c2185b]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#c2185b] mb-2">症例から選べる</h3>
                  <p className="w-full text-left text-sm text-[#7a6b70]">実績や症例を見ながら、自分に合うアートメイクアーティストを比較・検討できます。</p>
                </div>
                {/* Feature 2 */}
                <div className="flex w-full max-w-[280px] flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 mb-4">
                    <CalendarCheck2 className="h-8 w-8 text-[#c2185b]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#c2185b] mb-2">直接予約できる</h3>
                  <p className="w-full text-left text-sm text-[#7a6b70]">探すだけで終わらず、気になったアーティストへスムーズに直接予約・相談できます。</p>
                </div>
                {/* Feature 3 */}
                <div className="flex w-full max-w-[280px] flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-50 mb-4">
                    <BadgeCheck className="h-8 w-8 text-[#c2185b]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#c2185b] mb-2">初めてでも安心して探せる</h3>
                  <p className="w-full text-left text-sm text-[#7a6b70]">アートメイクが初めての人でも、選び方や症例比較を通して納得して予約することができます。</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA — full-bleed banner on mobile; inset shell from sm up (matches エリアから探す / 人気アーティスト) */}
        <section className="bg-white pt-10 sm:pt-12 lg:pt-14 pb-10 sm:pb-12 lg:pb-14">
          <div className="mx-auto max-w-[calc(1000px+4rem)] px-0 sm:px-6 lg:px-8">
            <div className="mx-auto w-full px-0 sm:px-6 lg:px-8">
              <div
                className="relative overflow-hidden rounded-none bg-cover bg-center bg-no-repeat py-10 sm:rounded-2xl sm:py-12 lg:py-14"
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url("${ARTIST_CTA_BACKGROUND_IMAGE}")`,
                }}
              >
                <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                  <h2 className="text-3xl font-bold text-white">
                    アートメイクアーティストの方へ
                  </h2>
                  <p className="mt-4 text-lg text-white/90">
                    MAKELEに登録して、多くの患者様にあなたの技術をアピールしませんか？
                    ポートフォリオ管理、予約管理、集客支援をすべてサポートします。
                  </p>
                  <Link
                    href="/register/artist"
                    className="mt-8 inline-block rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#c2185b] shadow-lg transition-transform hover:scale-105"
                  >
                    アーティスト登録はこちら
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        <Footer padBottomForFixedPromo />
      </main>
    </>
  );
}
