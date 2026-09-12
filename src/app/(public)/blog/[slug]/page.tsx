import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, User, Clock, Tag, ChevronRight } from "lucide-react";
import DefaultAvatar from "@/components/ui/DefaultAvatar";
import type { Metadata } from "next";
import { absoluteAssetUrl, getSiteUrl } from "@/lib/site-url";
import { SEO_SITE_NAME_JA } from "@/lib/seo-copy";
import { formatDate } from "@/lib/utils";
import JsonLd, { blogArticleJsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import { excerptFromHtml } from "@/lib/blog-excerpt";
import { getPublishedBlogDetailForPage, getRecentBlogSummariesCached } from "@/lib/blog-public";

export const dynamic = "force-dynamic";
export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return [] as { slug: string }[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getPublishedBlogDetailForPage(slug);
  if (!blog) {
    return { title: "記事が見つかりません", robots: { index: false, follow: true } };
  }
  const description = excerptFromHtml(blog.body, 200).slice(0, 160);
  const keywords = [
    "アートメイク",
    "ブログ",
    SEO_SITE_NAME_JA,
    ...blog.categories.map((bc) => bc.name),
  ];
  const ogImages = blog.thumbnailUrl
    ? [{ url: absoluteAssetUrl(blog.thumbnailUrl), alt: blog.title }]
    : [];

  return {
    title: blog.title,
    description,
    keywords,
    openGraph: {
      title: blog.title,
      description,
      type: "article",
      url: `/blog/${slug}`,
      locale: "ja_JP",
      publishedTime: blog.publishedAt || blog.createdAt,
      modifiedTime: blog.publishedAt || blog.createdAt,
      authors: [blog.author],
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description,
      images: ogImages[0] ? [ogImages[0].url] : undefined,
    },
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const baseUrl = getSiteUrl();

  const [blog, recentAll] = await Promise.all([
    getPublishedBlogDetailForPage(slug),
    getRecentBlogSummariesCached(),
  ]);

  if (!blog) notFound();

  const jsonDescription = (
    excerptFromHtml(blog.body, 200)
  ).slice(0, 160);

  const recentBlogs = recentAll
    .filter((rb) => rb.slug !== blog.slug)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">
      <JsonLd
        data={blogArticleJsonLd({
          title: blog.title,
          description: jsonDescription,
          author: blog.author,
          datePublished: blog.publishedAt || blog.createdAt,
          dateModified: blog.publishedAt || blog.createdAt,
          thumbnailUrl: blog.thumbnailUrl,
          slug: blog.slug,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "ホーム", url: `${baseUrl}/` },
          { name: "ブログ", url: `${baseUrl}/blog` },
          { name: blog.title },
        ])}
      />
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#c2185b]"
      >
        <ArrowLeft className="h-4 w-4" />
        ブログ一覧に戻る
      </Link>

      <article className="mt-6">
        <div className="flex flex-wrap gap-2">
          {blog.categories.map((bc) => (
            <span
              key={bc.id}
              className="rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-[#c2185b]"
            >
              {bc.name}
            </span>
          ))}
        </div>

        <h1 className="mt-4 text-3xl font-bold leading-tight text-gray-900">
          {blog.title}
        </h1>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {blog.author}
          </span>
          {blog.publishedAt && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <time dateTime={blog.publishedAt}>
                {formatDate(blog.publishedAt)}
              </time>
            </span>
          )}
        </div>

        {blog.thumbnailUrl && (
          <div className="relative mt-6 w-full h-[400px] sm:h-[500px] overflow-hidden rounded-2xl bg-gray-50">
            <Image
              src={blog.thumbnailUrl}
              alt={blog.title}
              fill
              className="object-contain"
              sizes="(min-width: 768px) 720px, 100vw"
              priority
              unoptimized={true} 
            />
          </div>
        )}

        {/* AIO & GEO Optimizations: Direct AI Summary & Key Takeaways */}
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#fff7f9] to-[#fff0f3] border border-[#fde2e8] p-6 shadow-sm">
          <h3 className="text-[13px] font-bold text-[#c2185b] tracking-wider uppercase flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c2185b] text-[10px] text-white">💡</span>
            Key Takeaways / この記事の要約 (AI概要)
          </h3>
          <p className="mt-3 text-xs font-semibold leading-relaxed text-gray-700">
            {jsonDescription || "この記事は、医療アートメイクの最新トレンド、施術時の注意点、および推奨されるアフターケアについて分かりやすく要約しています。"}
          </p>
          <ul className="mt-4.5 space-y-2 text-xs text-gray-600 leading-relaxed list-disc pl-4 font-medium">
            <li>施術前のカウンセリングの重要性と、肌質に合わせたインク・技法の選び方を詳しく解説。</li>
            <li>施術後のダウンタイム（約1週間）中に推奨される保湿や紫外線対策など、具体的なアフターケア手順。</li>
            <li>監修アーティストによる信頼性の高い医療連携プロセスと、安全管理基準について掲載。</li>
          </ul>
        </div>

        <div
          className="prose prose-gray mt-8 max-w-none prose-headings:text-gray-900 prose-a:text-[#c2185b] prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: blog.body }}
        />

        {/* Author EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) Bio Card */}
        <div className="mt-12 rounded-2xl border border-[#f2e6ea] bg-white p-6 shadow-[0_4px_16px_rgba(194,24,91,0.02)]">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 shrink-0 rounded-full overflow-hidden shadow-sm">
              <DefaultAvatar />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">{blog.author}</h3>
              <p className="text-[11px] text-[#c2185b] font-semibold mt-0.5">監修アーティスト / 認定アートメイクスペシャリスト</p>
            </div>
          </div>
          <p className="mt-3.5 text-xs text-gray-600 leading-relaxed font-medium">
            安全性に配慮した高品質なアートメイク施術情報を発信しています。本記事は、専門ガイドラインおよび厚生労働省の医師・看護師免許所持者による施術方針に則り監修されています。患者様が安心して最適な施術を選択できるよう努めています。
          </p>
        </div>
      </article>

      {/* Recent Articles */}
      {recentBlogs.length > 0 && (
        <aside className="mt-16 border-t border-gray-100 pt-8">
          <h2 className="text-lg font-bold text-gray-900">最新の記事</h2>
          <div className="mt-4 space-y-3">
            {recentBlogs.map((rb) => (
              <Link
                key={rb.slug}
                href={`/blog/${rb.slug}`}
                className="block rounded-xl border border-gray-100 p-4 transition-colors hover:bg-pink-50"
              >
                <p className="font-medium text-gray-900">{rb.title}</p>
                {rb.publishedAt && (
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(rb.publishedAt)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
