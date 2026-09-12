import { notFound } from "next/navigation";
import DefaultAvatar from "@/components/ui/DefaultAvatar";
import Link from "next/link";
import Image from "next/image";
import { ImageIcon, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { SEO_SITE_NAME_JA } from "@/lib/seo-copy";
import Pagination from "@/components/ui/Pagination";
import JsonLd, { breadcrumbJsonLd } from "@/components/seo/JsonLd";
import {
  getActiveCategorySlugParams,
  getCategoryBySlugWithTechniques,
  listPublishedArtistsPage,
  listPublishedCasesPage,
} from "@/lib/public-catalog";

export const revalidate = 60;

const ITEMS_PER_PAGE = 12;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  try {
    return await getActiveCategorySlugParams();
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlugWithTechniques(slug);
  if (!category) {
    return { title: "カテゴリが見つかりません", robots: { index: false, follow: true } };
  }
  const title = `${category.name}のアートメイク症例一覧`;
  const description = `${category.name}のアートメイク症例写真を多数掲載。Before/Afterから施術イメージを確認し、信頼できるアーティストを探せます。`;
  return {
    title,
    description,
    keywords: [category.name, "アートメイク", "症例", "Before After", SEO_SITE_NAME_JA],
    openGraph: {
      title: `${category.name}の症例一覧 | ${SEO_SITE_NAME_JA}`,
      description,
      url: `/categories/${slug}`,
      locale: "ja_JP",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name}の症例一覧`,
      description,
    },
    alternates: { canonical: `/categories/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const baseUrl = getSiteUrl();

  const category = await getCategoryBySlugWithTechniques(slug);

  if (!category) notFound();

  const [casesPayload, artistsPayload] = await Promise.all([
    listPublishedCasesPage({
      page,
      limit: ITEMS_PER_PAGE,
      sort: "popular",
      category: slug,
    }),
    listPublishedArtistsPage({
      page: 1,
      limit: 6,
      sort: "ranking",
      categorySlug: slug,
    }),
  ]);

  const cases = casesPayload.data;
  const total = casesPayload.total;
  const totalPages = casesPayload.totalPages;
  const artists = artistsPayload.data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${category.name}のアートメイク症例`,
          description: `${category.name}のアートメイク症例写真一覧。${SEO_SITE_NAME_JA}`,
          url: `${baseUrl}/categories/${slug}`,
          isPartOf: { "@type": "WebSite", name: SEO_SITE_NAME_JA, url: `${baseUrl}/` },
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "ホーム", url: `${baseUrl}/` },
          { name: "症例一覧", url: `${baseUrl}/cases` },
          { name: category.name, url: `${baseUrl}/categories/${slug}` },
        ])}
      />

      <div className="mb-8">
        <nav aria-label="パンくずリスト" className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#c2185b]">ホーム</Link>
          <span>/</span>
          <span className="text-gray-900">{category.name}</span>
        </nav>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          {category.name}のアートメイク症例
        </h1>
        <p className="mt-2 text-gray-500">
          {total}件の症例が見つかりました
        </p>

        {category.techniques.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {category.techniques.map((t) => (
              <span
                key={t.id}
                className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1 text-xs font-medium text-[#c2185b]"
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {cases.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          <p>このカテゴリの症例はまだありません</p>
          <Link href="/cases" className="mt-4 inline-block text-sm font-medium text-[#c2185b] hover:underline">
            症例一覧を見る
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/cases/${c.id}`}
                className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="grid grid-cols-2 gap-px bg-gray-100">
                  <div className="relative aspect-square bg-gray-50">
                    {c.beforeImgUrl ? (
                      <Image src={c.beforeImgUrl} alt={`${c.title} 施術前`} fill className="object-cover" sizes="(min-width: 1024px) 160px, (min-width: 640px) 25vw, 46vw"  unoptimized={true} />
                    ) : (
                      <div className="flex h-full items-center justify-center"><ImageIcon className="h-6 w-6 text-gray-300" /></div>
                    )}
                  </div>
                  <div className="relative aspect-square bg-gray-50">
                    {c.afterImgUrl ? (
                      <Image src={c.afterImgUrl} alt={`${c.title} 施術後`} fill className="object-cover" sizes="(min-width: 1024px) 160px, (min-width: 640px) 25vw, 46vw"  unoptimized={true} />
                    ) : (
                      <div className="flex h-full items-center justify-center"><ImageIcon className="h-6 w-6 text-gray-300" /></div>
                    )}
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-gray-900 group-hover:text-[#c2185b]">{c.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{c.artist.displayName}</p>
                  {c.technique && (
                    <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                      {c.technique.name}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination currentPage={page} totalPages={totalPages} />
            </div>
          )}
        </>
      )}

      {/* Artists specializing in this category */}
      {artists.length > 0 && (
        <section className="mt-16 border-t border-gray-100 pt-12">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {category.name}が得意なアーティスト
            </h2>
            <Link
              href={`/artists?categoryId=${category.id}`}
              className="flex items-center gap-1 text-sm font-medium text-[#c2185b] hover:underline"
            >
              すべて見る <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((a) => (
              <Link
                key={a.id}
                href={`/artists/${a.id}`}
                className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:border-pink-200"
              >
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pink-50">
                  {a.profileImgUrl ? (
                    <Image src={a.profileImgUrl} alt={`${a.displayName}のプロフィール写真`} width={48} height={48} className="h-full w-full object-cover"  unoptimized={true} />
                  ) : (
                    <DefaultAvatar />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-[#c2185b]">{a.displayName}</p>
                  <p className="text-sm text-gray-500">{a.area.prefecture}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
