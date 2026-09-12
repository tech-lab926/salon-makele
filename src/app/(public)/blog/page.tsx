import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { ITEMS_PER_PAGE } from "@/constants";
import { formatDate } from "@/lib/utils";
import { Suspense } from "react";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { SEO_SITE_NAME_JA } from "@/lib/seo-copy";
import { getCategoriesMinimalCached, listPublishedBlogsPage } from "@/lib/public-catalog";

export const revalidate = 60;

const blogListTitle = "ブログ";
const blogListDescription =
  "アートメイクに関するコラム、施術の基礎知識、トレンド情報など。カテゴリ別に記事を読めます。";

export const metadata: Metadata = {
  title: blogListTitle,
  description: blogListDescription,
  keywords: ["ブログ", "アートメイク", "コラム", "施術", SEO_SITE_NAME_JA],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `${blogListTitle} | ${SEO_SITE_NAME_JA}`,
    description: blogListDescription,
    url: "/blog",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${blogListTitle} | ${SEO_SITE_NAME_JA}`,
    description: blogListDescription,
  },
};

interface Props {
  searchParams: Promise<{ page?: string; category?: string }>;
}

type CategoryItem = { id: string; name: string; slug: string };
type BlogItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  author: string;
  categories: { id: string; name: string; slug: string }[];
};

export default async function BlogListPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = ITEMS_PER_PAGE;
  const selectedCategory = params.category || "";

  const [categories, blogsPayload] = await Promise.all([
    getCategoriesMinimalCached(),
    listPublishedBlogsPage({
      page,
      limit,
      categorySlug: selectedCategory || undefined,
    }),
  ]);

  const blogs = blogsPayload.data;
  const totalPages = blogsPayload.totalPages;

  function buildHref(slug: string) {
    if (slug === selectedCategory) return "/blog";
    return `/blog?category=${slug}`;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ブログ</h1>
        <p className="mt-2 text-gray-500">
          アートメイクに関する最新情報・お役立ち記事
        </p>
      </div>

      {categories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !selectedCategory
                ? "bg-[#c2185b] text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:border-[#c2185b] hover:text-[#c2185b]"
            }`}
          >
            すべて
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildHref(cat.slug)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === cat.slug
                  ? "bg-[#c2185b] text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-[#c2185b] hover:text-[#c2185b]"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {blogs.length === 0 ? (
        <EmptyState
          title="記事がまだありません"
          description={
            selectedCategory
              ? "このカテゴリの記事はまだありません。"
              : "最新の記事を公開次第、こちらに表示されます。"
          }
          actionLabel="トップページへ"
          actionHref="/"
        />
      ) : (
        <>
          <div className="mt-8 space-y-6">
            {blogs.map((blog) => (
              <Link
                key={blog.id}
                href={`/blog/${blog.slug}`}
                className="group flex gap-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-pink-50 sm:h-36 sm:w-36">
                  {blog.thumbnailUrl ? (
                    <Image
                      src={blog.thumbnailUrl}
                      alt={blog.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 640px) 144px, 112px"
                     unoptimized={true} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen className="h-10 w-10 text-[#c2185b]/30" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    {blog.categories.map((bc) => (
                      <span
                        key={bc.id}
                        className="rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-medium text-[#c2185b]"
                      >
                        {bc.name}
                      </span>
                    ))}
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-gray-900 transition-colors group-hover:text-[#c2185b] line-clamp-2">
                    {blog.title}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {(() => {
                      const t = blog.excerpt?.trim();
                      if (!t) return "…";
                      return t.length > 150 ? `${t.slice(0, 150)}…` : t;
                    })()}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                    {blog.publishedAt && (
                      <time dateTime={blog.publishedAt}>
                        {formatDate(blog.publishedAt)}
                      </time>
                    )}
                    <span>{blog.author}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10">
            <Suspense>
              <Pagination currentPage={page} totalPages={totalPages} />
            </Suspense>
          </div>
        </>
      )}
    </div>
  );
}
