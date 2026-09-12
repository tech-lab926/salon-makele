import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import type { Metadata } from "next";
import { ITEMS_PER_PAGE } from "@/constants";
import ListingFilters from "@/components/ui/ListingFilters";
import EmptyState from "@/components/ui/EmptyState";
import LoadMoreCases from "@/components/ui/LoadMoreCases";
import { SEO_SITE_NAME_JA } from "@/lib/seo-copy";
import {
  getAreasMinimalCached,
  getCategoriesMinimalCached,
  listPublishedCasesPage,
} from "@/lib/public-catalog";

export const revalidate = 60;

const casesTitle = "症例一覧";
const casesDescription =
  "アートメイクのBefore/After症例写真を多数掲載。カテゴリ・エリア・人気順で絞り込み、理想の仕上がりを探せます。";

export const metadata: Metadata = {
  title: casesTitle,
  description: casesDescription,
  keywords: ["症例", "Before After", "アートメイク", "眉毛", "リップ", SEO_SITE_NAME_JA],
  alternates: { canonical: "/cases" },
  openGraph: {
    title: `${casesTitle} | ${SEO_SITE_NAME_JA}`,
    description: casesDescription,
    url: "/cases",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${casesTitle} | ${SEO_SITE_NAME_JA}`,
    description: casesDescription,
  },
};

type CaseListItem = {
  id: string;
  title: string;
  beforeImgUrl: string | null;
  afterImgUrl: string | null;
  category: { id: string; name: string; slug: string };
  artist: { id: string; displayName: string; profileImgUrl: string | null };
  technique: { id: string; name: string } | null;
};

interface Props {
  searchParams: Promise<{
    category?: string;
    categoryId?: string;
    areaId?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function CasesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = ITEMS_PER_PAGE;
  const sort = params.sort || "newest";

  const [casesPayload, categories, areas] = await Promise.all([
    listPublishedCasesPage({
      page,
      limit,
      sort,
      category: params.category,
      categoryId: params.categoryId,
      areaId: params.areaId,
    }),
    getCategoriesMinimalCached(),
    getAreasMinimalCached(),
  ]);

  const cases = casesPayload.data;
  const total = casesPayload.total;
  const totalPages = casesPayload.totalPages;

  return (
    <div className="mx-auto w-full max-w-[calc(1000px+4rem)] px-6 py-8 lg:px-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">症例一覧</h1>
        <p className="mt-2 text-gray-500">
          リアルなBefore / After写真からアートメイクの仕上がりを確認
        </p>
      </div>

      <Suspense>
        <ListingFilters
          categories={categories.map((c) => ({
            id: c.id,
            label: c.name,
          }))}
          areas={areas.map((area) => ({
            id: area.id,
            label: area.prefecture,
          }))}
          sortOptions={[
            { value: "newest", label: "新着順" },
            { value: "popular", label: "人気順" },
          ]}
          showReset
        />
      </Suspense>

      <p className="mt-6 text-sm text-gray-500">{Number(total)}件の症例</p>

      {cases.length === 0 ? (
        <EmptyState
          title="症例が見つかりません"
          description="条件を変えて再度お試しください"
          actionLabel="すべての症例を見る"
          actionHref="/cases"
        />
      ) : (
          <LoadMoreCases initialCases={cases as any} totalPages={totalPages} />
      )}
    </div>
  );
}
