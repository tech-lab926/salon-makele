import { notFound } from "next/navigation";
import DefaultAvatar from "@/components/ui/DefaultAvatar";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Layers, Calendar, ArrowRight, ImageIcon } from "lucide-react";
import type { Metadata } from "next";
import { absoluteAssetUrl, getSiteUrl } from "@/lib/site-url";
import { SEO_SITE_NAME_JA } from "@/lib/seo-copy";
import { formatDate } from "@/lib/utils";
import JsonLd, { caseStudyJsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import ViewTracker from "@/components/tracking/ViewTracker";
import ZoomableImage from "@/components/ui/ZoomableImage";
import {
  getPublishedCaseDetailSerialized,
  getPublishedRelatedCases,
} from "@/lib/case-public";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

/** On-demand ISR only — avoids huge builds as case count grows (REQUIREMENTS scale). */
export function generateStaticParams() {
  return [] as { id: string }[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = await getPublishedCaseDetailSerialized(id);
  if (!c) {
    return { title: "症例が見つかりません", robots: { index: false, follow: true } };
  }
  const description = c.description.slice(0, 160);
  const title = `${c.title} | ${c.category.name}の症例`;
  const ogImages: { url: string; alt: string }[] = [];
  if (c.afterImgUrl) {
    ogImages.push({
      url: absoluteAssetUrl(c.afterImgUrl),
      alt: `${c.title} 施術後`,
    });
  }
  if (c.beforeImgUrl) {
    ogImages.push({
      url: absoluteAssetUrl(c.beforeImgUrl),
      alt: `${c.title} 施術前`,
    });
  }
  const keywords = [
    c.category.name,
    "アートメイク",
    "症例",
    "Before After",
    SEO_SITE_NAME_JA,
  ];
  if (c.technique?.name) keywords.unshift(c.technique.name);

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: `${c.title} | ${c.category.name}のアートメイク症例`,
      description,
      url: `/cases/${id}`,
      type: "article",
      locale: "ja_JP",
      publishedTime: new Date(c.createdAt).toISOString(),
      modifiedTime: new Date(c.createdAt).toISOString(),
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages[0] ? [ogImages[0].url] : undefined,
    },
    alternates: { canonical: `/cases/${id}` },
  };
}

export default async function CaseDetailPage({ params }: Props) {
  const { id } = await params;
  const baseUrl = getSiteUrl();

  const caseItem = await getPublishedCaseDetailSerialized(id);

  if (!caseItem) notFound();

  const relatedCases = await getPublishedRelatedCases(caseItem.category.id, caseItem.id);

  const artistMenus = await prisma.menu.findMany({
    where: {
      artistId: BigInt(caseItem.artist.id),
      categoryId: BigInt(caseItem.category.id),
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      durationMin: true,
    },
    orderBy: { sortOrder: 'asc' }
  });

  return (
    <div className="mx-auto w-full max-w-[calc(1000px+4rem)] px-6 py-8 lg:px-8">
      <ViewTracker targetType="case" targetId={caseItem.id.toString()} />
      <JsonLd
        data={caseStudyJsonLd({
          title: caseItem.title,
          description: caseItem.description,
          category: caseItem.category.name,
          artistName: caseItem.artist.displayName,
          beforeImg: caseItem.beforeImgUrl || "",
          afterImg: caseItem.afterImgUrl || "",
          datePublished: new Date(caseItem.createdAt).toISOString(),
          dateModified: new Date(caseItem.createdAt).toISOString(),
          id: caseItem.id.toString(),
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "ホーム", url: `${baseUrl}/` },
          { name: "症例一覧", url: `${baseUrl}/cases` },
          { name: caseItem.category.name, url: `${baseUrl}/categories/${caseItem.category.slug}` },
          { name: caseItem.title },
        ])}
      />
      {/* Breadcrumb */}
      <nav aria-label="パンくずリスト" className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/cases" className="hover:text-[#c2185b]">
          症例一覧
        </Link>
        <span>/</span>
        <Link
          href={`/cases?category=${caseItem.category.slug}`}
          className="hover:text-[#c2185b]"
        >
          {caseItem.category.name}
        </Link>
        <span>/</span>
        <span className="truncate text-gray-900">{caseItem.title}</span>
      </nav>

      <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
        {caseItem.title}
      </h1>

      {/* Before / After */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
          <div className="bg-gray-900 px-4 py-2 text-center text-sm font-medium text-white">
            Before
          </div>
          <div className="relative w-full bg-gray-50">
            {caseItem.beforeImgUrl ? (
              <ZoomableImage
                src={caseItem.beforeImgUrl}
                alt={`${caseItem.title} 施術前の写真`}
                className="object-contain object-center"
                sizes="(min-width: 640px) 450px, 100vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-100">
                <ImageIcon className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
          <div className="bg-[#c2185b] px-4 py-2 text-center text-sm font-medium text-white">
            After
          </div>
          <div className="relative w-full bg-gray-50">
            {caseItem.afterImgUrl ? (
              <ZoomableImage
                src={caseItem.afterImgUrl}
                alt={`${caseItem.title} 施術後の写真`}
                className="object-contain object-center"
                sizes="(min-width: 640px) 450px, 100vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-100">
                <ImageIcon className="h-16 w-16 text-gray-300" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Description + Metadata */}
        <div className="lg:col-span-2 space-y-6">
          {caseItem.menu && (
            <div className="rounded-2xl border border-pink-100 bg-gradient-to-r from-pink-50/40 to-rose-50/40 p-6 shadow-sm">
              <span className="inline-block rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-[#c2185b]">
                施術したメニュー
              </span>
              <h3 className="mt-3 text-lg font-bold text-gray-900">
                {caseItem.menu.name}
              </h3>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-gray-400" /> {caseItem.menu.durationMin}分
                </span>
                <span className="text-gray-300">|</span>
                <span className="font-semibold text-base text-[#c2185b]">
                  {caseItem.menu.price ? `¥${caseItem.menu.price.toLocaleString("ja-JP")}` : "要相談"}
                </span>
              </div>
              <Link
                href={`/booking/${caseItem.artist.id}?menuId=${caseItem.menu.id}`}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c2185b] py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#880e4f]"
              >
                このメニューで空き状況を確認・予約する
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">施術詳細</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
              {caseItem.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
              <Layers className="mx-auto h-5 w-5 text-[#c2185b]" />
              <p className="mt-2 text-xs text-gray-500">カテゴリ</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-900">
                {caseItem.category.name}
              </p>
            </div>
            {caseItem.technique && (
              <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <Layers className="mx-auto h-5 w-5 text-[#c2185b]" />
                <p className="mt-2 text-xs text-gray-500">技法</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">
                  {caseItem.technique.name}
                </p>
              </div>
            )}
            {caseItem.sessionCount && (
              <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <Calendar className="mx-auto h-5 w-5 text-[#c2185b]" />
                <p className="mt-2 text-xs text-gray-500">回数</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">
                  {caseItem.sessionCount}回目
                </p>
              </div>
            )}
            {caseItem.downtimeDays != null && (
              <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
                <Clock className="mx-auto h-5 w-5 text-[#c2185b]" />
                <p className="mt-2 text-xs text-gray-500">ダウンタイム</p>
                <p className="mt-0.5 text-sm font-semibold text-gray-900">
                  {caseItem.downtimeDays}日
                </p>
              </div>
            )}
          </div>

          {caseItem.downtimeNote && (
            <div className="rounded-xl border border-gray-100 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                <span className="font-medium">ダウンタイムの補足：</span>{" "}
                {caseItem.downtimeNote}
              </p>
            </div>
          )}
        </div>

        {/* Artist Card */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
              担当アーティスト
            </p>
            <Link
              href={`/artists/${caseItem.artist.id}`}
              className="group mt-4 flex items-center gap-4"
            >
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pink-100 to-rose-50">
                {caseItem.artist.profileImgUrl ? (
                  <Image
                    src={caseItem.artist.profileImgUrl}
                    alt={`${caseItem.artist.displayName}のプロフィール写真`}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                   unoptimized={true} />
                ) : (
                  <DefaultAvatar />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900 transition-colors group-hover:text-[#c2185b]">
                  {caseItem.artist.displayName}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {caseItem.artist.area.prefecture}
                </p>
              </div>
            </Link>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-pink-50 px-2.5 py-0.5 text-xs text-[#c2185b]">
                {caseItem.category.name}
              </span>
            </div>
            <Link
              href={`/booking/${caseItem.artist.id}`}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#c2185b] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#880e4f]"
            >
              空き状況を確認する
              <Calendar className="h-4 w-4" />
            </Link>
            <Link
              href={`/artists/${caseItem.artist.id}`}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              プロフィールを見る
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
            <p className="text-xs text-gray-400">掲載日</p>
            <p className="mt-1 text-sm font-medium text-gray-700">
              {formatDate(caseItem.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Related Menus Section */}
      {artistMenus.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-gray-900">
            関連するメニュー
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artistMenus.map((menu: { id: bigint; name: string; price: number | null; durationMin: number }) => (
              <div
                key={menu.id.toString()}
                className="flex flex-col justify-between overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm p-4"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {menu.name}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> {menu.durationMin}分
                    <span className="text-gray-300">|</span>
                    <span className="font-medium text-[#c2185b]">
                      {menu.price ? `¥${menu.price.toLocaleString("ja-JP")}` : "要相談"}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/booking/${caseItem.artist.id}?menuId=${menu.id.toString()}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#c2185b] py-2 text-sm font-medium text-white transition-colors hover:bg-[#880e4f]"
                >
                  空き状況を確認・予約する
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Related Cases */}
      {relatedCases.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-gray-900">
            関連する症例
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCases.map((rc) => (
              <Link
                key={rc.id}
                href={`/cases/${rc.id}`}
                className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="grid grid-cols-2 gap-px bg-gray-100">
                  <div className="relative aspect-square w-full bg-gray-50">
                    {rc.beforeImgUrl ? (
                      <Image src={rc.beforeImgUrl} alt={`${rc.title} 施術前`} fill sizes="(min-width: 640px) 130px, 46vw" className="object-cover" unoptimized={true} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100">
                        <ImageIcon className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="relative aspect-square w-full bg-gray-50">
                    {rc.afterImgUrl ? (
                      <Image src={rc.afterImgUrl} alt={`${rc.title} 施術後`} fill sizes="(min-width: 640px) 130px, 46vw" className="object-cover" unoptimized={true} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100">
                        <ImageIcon className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate text-xs font-medium text-gray-900 group-hover:text-[#c2185b]">
                    {rc.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {rc.artist.displayName}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
