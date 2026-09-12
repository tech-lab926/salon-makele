import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Grid2x2, Search, SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";
import { ITEMS_PER_PAGE } from "@/constants";
import LoadMoreArtists from "@/components/ui/LoadMoreArtists";
import EmptyState from "@/components/ui/EmptyState";
import { SEO_SITE_NAME_JA } from "@/lib/seo-copy";
import {
  getAreasMinimalCached,
  getCategoriesMinimalCached,
  listPublishedArtistsPage,
} from "@/lib/public-catalog";

export const revalidate = 60;

const artistsTitle = "アーティスト一覧";
const artistsDescription =
  "信頼できるアートメイクアーティストを探す。都道府県・施術カテゴリで絞り込み、人気順・新着順で表示できます。";

// --- Configuration for Artist Count Display ---
// Line 20: Change the number here (e.g., "10", "100", etc.)
const DISPLAY_ARTIST_COUNT = "10";
// Line 22: Change the date text here
const DISPLAY_ARTIST_DATE = "2026年5月時点";
// ----------------------------------------------

export const metadata: Metadata = {
  title: artistsTitle,
  description: artistsDescription,
  keywords: ["アーティスト", "アートメイク", "眉毛", "リップ", "エリア", SEO_SITE_NAME_JA],
  alternates: { canonical: "/artists" },
  openGraph: {
    title: `${artistsTitle} | ${SEO_SITE_NAME_JA}`,
    description: artistsDescription,
    url: "/artists",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${artistsTitle} | ${SEO_SITE_NAME_JA}`,
    description: artistsDescription,
  },
};

type ArtistListItem = {
  id: string;
  displayName: string;
  profileImgUrl: string | null;
  viewCount: number;
  area: { id: string; prefecture: string; city: string | null };
  skills: { id: string; name: string; slug: string }[];
  caseCount: number;
};

type CategoryItem = { id: string; name: string; slug: string };
type AreaItem = { id: string; prefecture: string; city: string | null };

function buildQueryHref(
  current: Record<string, string | undefined>,
  updates: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  const merged = { ...current, ...updates };

  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }

  return `/artists${params.toString() ? `?${params.toString()}` : ""}`;
}

function formatCompactCount(count: number) {
  return new Intl.NumberFormat("ja-JP").format(count);
}

function buildRegionGroups(areas: AreaItem[]) {
  const groups = [
    {
      label: "北海道・東北",
      names: ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
    },
    {
      label: "関東",
      names: ["茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県"],
    },
    {
      label: "中部",
      names: ["新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県"],
    },
    {
      label: "関西",
      names: ["三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県"],
    },
    {
      label: "中国・四国",
      names: ["鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県"],
    },
    {
      label: "九州・沖縄",
      names: ["福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"],
    },
  ];

  return groups.map((group) => ({
    ...group,
    items: areas.filter((area) => group.names.includes(area.prefecture)),
  }));
}

interface Props {
  searchParams: Promise<{
    areaId?: string;
    categoryId?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ArtistsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const limit = ITEMS_PER_PAGE;
  const sort = params.sort || "ranking";

  const [artistsPayload, categories, areas] = await Promise.all([
    listPublishedArtistsPage({
      page,
      limit,
      sort,
      areaId: params.areaId,
      categoryId: params.categoryId,
    }),
    getCategoriesMinimalCached(),
    getAreasMinimalCached(),
  ]);

  const artists = artistsPayload.data;
  const total = artistsPayload.total;
  const totalPages = artistsPayload.totalPages;
  const selectedArea = params.areaId || "";
  const selectedCategory = params.categoryId || "";
  const selectedSort = params.sort || "ranking";

  const designCategoryNames = ["眉", "リップ", "アイライン", "ヘアライン", "SMP", "ほくろ", "傷跡修正"];
  const quickCategoryChips = designCategoryNames.map((name, index) => {
    const realCat = categories.find(c => c.name === name);
    return realCat || { id: `mock-${index}`, name, slug: `mock-${index}` };
  });
  const sidebarAreaGroups = buildRegionGroups(areas);
  const sidebarConditionItems = [
    "医療機関在籍",
    "指名料無料",
    "女性アーティストのみ",
    "症例写真が豊富",
    "口コミ評価4.8以上",
  ];

  const activeParams = {
    areaId: selectedArea,
    categoryId: selectedCategory,
    sort: selectedSort,
    page: String(page),
  };

  const clearHref = buildQueryHref({}, { areaId: undefined, categoryId: undefined, sort: "ranking", page: undefined });

  return (
    <div className="bg-white text-[#231f28]">
      {/* Breadcrumb — wraps on narrow viewports; tap-friendly links */}
      <div className="bg-[#FFF3F6]">
        <nav
          aria-label="Breadcrumb"
          className="mx-auto w-full max-w-[calc(1000px+4rem)] px-6 py-2 lg:px-8"
        >
          <ol className="m-0 flex min-w-0 list-none flex-wrap items-center gap-x-0 gap-y-1 p-0 text-[11px] font-medium leading-snug text-gray-500 sm:text-[12px] min-[768px]:max-[900px]:text-[14px]">
            <li className="min-w-0">
              <Link
                href="/"
                className="inline-block max-w-full rounded-md py-1.5 pe-1 underline-offset-2 transition-colors hover:text-gray-800 hover:underline sm:py-1"
              >
                TOP
              </Link>
            </li>
            <li className="shrink-0 select-none px-1.5 text-gray-400 sm:px-2" aria-hidden>
              &gt;
            </li>
            <li className="min-w-0 text-gray-600" aria-current="page">
              アーティスト一覧
            </li>
          </ol>
        </nav>
      </div>

      <div className="bg-white">
        <div className="mx-auto w-full max-w-[calc(1000px+4rem)] px-6 pb-10 pt-8 lg:px-8 min-[768px]:max-[900px]:px-8">

          <section className="mt-4 flex items-start justify-between gap-6">
            <div>
              <h1 className="text-[36px] font-medium tracking-tight text-gray-900 sm:text-[40px] min-[768px]:max-[900px]:text-[44px]">アーティスト一覧</h1>
              <p className="mt-3 text-[14px] font-medium text-gray-500 sm:text-[15px] min-[768px]:max-[900px]:text-[17px]">
                理想のアートメイクアーティストを見つけましょう
              </p>
            </div>

            <div className="hidden text-center sm:block">
              <p className="text-[14px] font-bold tracking-[0.05em] text-gray-400 min-[768px]:max-[900px]:text-[16px]">掲載アーティスト数</p>
              <div className="mt-2 flex items-center justify-center gap-5 min-[768px]:max-[900px]:gap-6">
                <Image src="/laurel-left.svg" alt="" width={32} height={64} className="opacity-80 min-[768px]:max-[900px]:h-[72px] min-[768px]:max-[900px]:w-9" />
                <div className="-mt-2">
                  <div className="text-[56px] font-bold leading-none tracking-tight text-[#D85F7E] min-[768px]:max-[900px]:text-[62px]">
                    {DISPLAY_ARTIST_COUNT}<span className="ml-1 text-[28px] font-medium tracking-normal text-[#D85F7E] min-[768px]:max-[900px]:text-[32px]">名</span>
                  </div>
                  <p className="mt-1 text-[12px] font-medium text-gray-400 min-[768px]:max-[900px]:text-[14px]">({DISPLAY_ARTIST_DATE})</p>
                </div>
                <Image src="/laurel-right.svg" alt="" width={32} height={64} className="opacity-80 min-[768px]:max-[900px]:h-[72px] min-[768px]:max-[900px]:w-9" />
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-[24px] border border-[#f2e6eb] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(194,24,91,0.05)] min-[768px]:max-[900px]:px-6 min-[768px]:max-[900px]:py-6">
            <form
              action="/artists"
              method="get"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-4 lg:grid-cols-4 lg:items-end lg:gap-x-3 lg:gap-y-4"
            >
              <input type="hidden" name="page" value="1" />
              <div className="min-w-0">
                <label className="mb-2 block text-[12px] font-medium text-gray-600 min-[768px]:max-[900px]:mb-2.5 min-[768px]:max-[900px]:text-[14px]">エリアを選択</label>
                <select
                  name="areaId"
                  defaultValue={selectedArea}
                  className="h-12 w-full appearance-none rounded-xl border border-[#e9e1e6] bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%239CA3AF%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27m6%208%204%204%204-4%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1rem_center] bg-no-repeat px-4 text-[15px] text-gray-700 outline-none transition focus:border-[#c2185b] min-[768px]:max-[900px]:h-[52px] min-[768px]:max-[900px]:px-5 min-[768px]:max-[900px]:text-[16px]"
                >
                  <option value="">東京</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.prefecture}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-[12px] font-medium text-gray-600 min-[768px]:max-[900px]:mb-2.5 min-[768px]:max-[900px]:text-[14px]">施術メニューを選択</label>
                <select
                  name="categoryId"
                  defaultValue={selectedCategory}
                  className="h-12 w-full appearance-none rounded-xl border border-[#e9e1e6] bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%239CA3AF%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27m6%208%204%204%204-4%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1rem_center] bg-no-repeat px-4 text-[15px] text-gray-700 outline-none transition focus:border-[#c2185b] min-[768px]:max-[900px]:h-[52px] min-[768px]:max-[900px]:px-5 min-[768px]:max-[900px]:text-[16px]"
                >
                  <option value="">すべて</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-[12px] font-medium text-gray-600 min-[768px]:max-[900px]:mb-2.5 min-[768px]:max-[900px]:text-[14px]">施術部位を選択</label>
                <select
                  name="sort"
                  defaultValue={selectedSort}
                  className="h-12 w-full appearance-none rounded-xl border border-[#e9e1e6] bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%239CA3AF%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27m6%208%204%204%204-4%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[position:right_1rem_center] bg-no-repeat px-4 text-[15px] text-gray-700 outline-none transition focus:border-[#c2185b] min-[768px]:max-[900px]:h-[52px] min-[768px]:max-[900px]:px-5 min-[768px]:max-[900px]:text-[16px]"
                >
                  <option value="ranking">すべて</option>
                  <option value="newest">新着順</option>
                </select>
              </div>

              <div className="min-w-0">
                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d56d8d] to-[#c2185b] px-4 text-[15px] font-semibold text-white shadow-[0_12px_22px_rgba(194,24,91,0.16)] transition hover:brightness-105 min-[768px]:max-[900px]:h-[52px] min-[768px]:max-[900px]:text-[16px] lg:px-5"
                >
                  <Search className="h-4 w-4 shrink-0 min-[768px]:max-[900px]:h-[18px] min-[768px]:max-[900px]:w-[18px]" />
                  検索する
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap gap-2 sm:gap-2.5 lg:gap-3">
              {quickCategoryChips.map((category) => {
                const href = buildQueryHref(activeParams, { categoryId: category.id, page: undefined });
                const active = category.id === selectedCategory;
                return (
                  <Link
                    key={category.id}
                    href={href}
                    className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition sm:px-5 sm:py-2.5 min-[768px]:max-[900px]:px-6 min-[768px]:max-[900px]:py-3 min-[768px]:max-[900px]:text-[15px] ${
                      active
                        ? "bg-[#D85F7E] text-white shadow-sm"
                        : "bg-[#FFF3F6] text-[#D85F7E] hover:bg-[#F7DDE5]"
                    }`}
                  >
                    {category.name}
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-b border-transparent pb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-[18px] font-medium text-gray-700 min-[768px]:max-[900px]:text-[21px]">検索結果：</span>
              <span className="text-[36px] font-bold leading-none text-[#d56d8d] min-[768px]:max-[900px]:text-[40px]">{formatCompactCount(total)}</span>
              <span className="text-[18px] font-medium text-gray-600 min-[768px]:max-[900px]:text-[21px]">件</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[14px] text-gray-500 min-[768px]:max-[900px]:text-[16px]">並び替え</span>
              <select
                defaultValue={selectedSort}
                className="h-10 rounded-lg border border-[#e9e1e6] bg-white px-4 text-[14px] text-gray-700 outline-none focus:border-[#d56d8d] min-[768px]:max-[900px]:h-11 min-[768px]:max-[900px]:px-5 min-[768px]:max-[900px]:text-[16px]"
              >
                <option value="ranking">おすすめ順</option>
                <option value="newest">新着順</option>
              </select>
              <span className="ml-2 text-[14px] text-gray-500 min-[768px]:max-[900px]:text-[16px]">表示方法</span>
              <div className="flex items-center rounded-lg border border-[#e9e1e6] bg-white p-1 min-[768px]:max-[900px]:p-1.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#fff5f8] text-[#c2185b] min-[768px]:max-[900px]:h-10 min-[768px]:max-[900px]:w-10">
                  <Grid2x2 className="h-4 w-4 min-[768px]:max-[900px]:h-[18px] min-[768px]:max-[900px]:w-[18px]" />
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-md text-gray-300 min-[768px]:max-[900px]:h-10 min-[768px]:max-[900px]:w-10">
                  <SlidersHorizontal className="h-4 w-4 min-[768px]:max-[900px]:h-[18px] min-[768px]:max-[900px]:w-[18px]" />
                </span>
              </div>
            </div>
          </div>

          {artists.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="アーティストが見つかりません"
                description="条件を変えて再度お試しください"
                actionLabel="フィルターをリセット"
                actionHref="/artists"
              />
            </div>
          ) : (
            <>
              {/* Mobile: artist grid first; detailed filters below. Desktop: lg:flex-row-reverse keeps sidebar left, grid right. */}
              <div className="mt-6 flex flex-col gap-8 lg:flex-row-reverse lg:items-start">
              <div className="min-w-0 flex-1">
                <LoadMoreArtists initialArtists={artists as any} totalPages={totalPages} />
              </div>

              <aside className="w-full shrink-0 border-t border-[#f2e6eb] pt-8 min-[768px]:max-[900px]:pt-10 lg:w-[220px] lg:border-t-0 lg:pt-0 xl:w-[240px] lg:sticky lg:top-32">
                <div className="space-y-8 min-[768px]:max-[900px]:space-y-10 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2 lg:pb-[60px] overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-track]:bg-transparent">
                  <section>
                    <h2 className="text-[15px] font-bold text-gray-800 min-[768px]:max-[900px]:text-[18px]">エリアから探す</h2>
                    <div className="mt-4 flex flex-col gap-1">
                      {sidebarAreaGroups.map((group) => (
                        <div key={group.label}>
                          <div className="px-3 py-2 text-[13px] font-bold text-gray-800 min-[768px]:max-[900px]:px-3.5 min-[768px]:max-[900px]:py-2.5 min-[768px]:max-[900px]:text-[16px]">{group.label}</div>
                          {group.items.map((area) => {
                            const href = buildQueryHref(activeParams, { areaId: area.id, page: undefined });
                            const active = area.id === selectedArea;
                            return (
                              <Link
                                key={area.id}
                                href={href}
                                className={`block w-full px-4 py-2.5 text-[14px] transition min-[768px]:max-[900px]:px-5 min-[768px]:max-[900px]:py-3 min-[768px]:max-[900px]:text-[16px] ${
                                  active ? "bg-[#fff0f5] text-[#c2185b] font-bold" : "text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                {area.prefecture}
                              </Link>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h2 className="text-[15px] font-bold text-gray-800 min-[768px]:max-[900px]:text-[18px]">施術メニューから探す</h2>
                    <div className="mt-4 flex flex-col gap-3 px-2">
                      {categories.map((category) => {
                        const active = category.id === selectedCategory;
                        const href = buildQueryHref(activeParams, {
                          categoryId: active ? undefined : category.id,
                          page: undefined,
                        });
                        return (
                          <Link key={category.id} href={href} className="flex cursor-pointer items-center gap-3.5 text-[14px] text-gray-600 hover:text-gray-900 group min-[768px]:max-[900px]:gap-4 min-[768px]:max-[900px]:text-[16px]">
                            <div
                              className={`flex h-4 w-4 items-center justify-center rounded border transition-colors min-[768px]:max-[900px]:h-5 min-[768px]:max-[900px]:w-5 ${
                                active ? "bg-[#c2185b] border-[#c2185b]" : "border-gray-300 group-hover:border-[#c2185b]"
                              }`}
                            >
                              {active && (
                                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" className="h-3 w-3 min-[768px]:max-[900px]:h-3.5 min-[768px]:max-[900px]:w-3.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <span className={active ? "text-[#c2185b] font-medium" : ""}>{category.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </section>

                  <section>
                    <h2 className="text-[15px] font-bold text-gray-800 min-[768px]:max-[900px]:text-[18px]">こだわり条件</h2>
                    <div className="mt-4 flex flex-col gap-3 px-2">
                      {sidebarConditionItems.map((label) => (
                        <div key={label} className="flex cursor-pointer items-center gap-3.5 text-[14px] text-gray-600 hover:text-gray-900 group min-[768px]:max-[900px]:gap-4 min-[768px]:max-[900px]:text-[16px]">
                          <div className="flex h-4 w-4 items-center justify-center rounded border border-gray-300 transition-colors group-hover:border-[#c2185b] min-[768px]:max-[900px]:h-5 min-[768px]:max-[900px]:w-5">
                            {/* Placeholder for now as these aren't in the API yet */}
                          </div>
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="flex w-full flex-col gap-3 pt-4 min-[768px]:max-[899px]:max-w-xs">
                    <Link
                      href={clearHref}
                      className="flex w-full items-center justify-center rounded-lg border border-[#d56d8d] bg-white px-4 py-3 text-[14px] font-medium text-[#d56d8d] transition hover:bg-[#fff5f8] min-[768px]:max-[899px]:px-8 min-[768px]:max-[899px]:py-3.5 min-[768px]:max-[899px]:text-[16px]"
                    >
                      条件をクリア
                    </Link>
                    <Link
                      href={buildQueryHref(activeParams, { page: undefined })}
                      className="flex w-full items-center justify-center rounded-lg bg-[#c2185b] px-4 py-3 text-[14px] font-bold text-white transition hover:bg-[#a3144c] min-[768px]:max-[899px]:px-8 min-[768px]:max-[899px]:py-3.5 min-[768px]:max-[899px]:text-[16px]"
                    >
                      この条件で検索する
                    </Link>
                  </div>
                </div>
              </aside>
            </div>



            <div className="mt-12 overflow-hidden rounded-[20px] bg-[#fff9fb] border border-[#fdf2f6] shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
              <div className="flex flex-col gap-6 px-5 py-8 sm:px-10 min-[768px]:max-[899px]:items-center min-[768px]:max-[899px]:gap-8 min-[768px]:max-[899px]:py-10 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:py-6 lg:pr-10">
                <div className="flex min-w-0 flex-1 flex-col gap-3 text-left min-[768px]:max-[899px]:flex-none min-[768px]:max-[899px]:text-center min-[768px]:max-[899px]:items-center min-[768px]:max-[899px]:gap-3.5">
                  <p className="text-[14px] font-bold tracking-wide text-[#d56d8d] min-[768px]:max-[899px]:text-[16px]">アーティスト選びに迷ったら...</p>
                  <h2 className="text-[20px] font-medium tracking-tight text-gray-800 sm:text-[22px] min-[768px]:max-[899px]:text-[24px]">
                    無料カウンセリングで相談してみませんか？
                  </h2>
                  <p className="text-[15px] text-gray-500 min-[768px]:max-[899px]:text-[17px]">あなたにぴったりのアーティストをご提案します。</p>
                </div>

                <div className="flex w-full min-w-0 flex-row items-center justify-center gap-3 sm:gap-5 min-[768px]:max-[899px]:w-auto min-[768px]:max-[899px]:gap-6 lg:w-auto lg:shrink-0 lg:justify-end">
                  <Link
                    href="/search"
                    className="inline-flex min-h-[46px] min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-[#d56d8d] to-[#c2185b] px-3.5 py-2.5 text-[13px] font-bold leading-snug text-white shadow-md transition hover:brightness-105 sm:h-12 sm:w-auto sm:flex-initial sm:shrink-0 sm:px-6 sm:text-[14px] min-[768px]:max-[899px]:min-h-[52px] min-[768px]:max-[899px]:px-7 min-[768px]:max-[899px]:text-[16px] lg:px-8 lg:text-[15px]"
                  >
                    無料で相談してみる ＞
                  </Link>
                  <Image
                    src="/demo/clinic_staff_model.png"
                    alt="カウンセリングイメージ"
                    width={180}
                    height={180}
                    className="h-[110px] w-auto max-w-[6.75rem] shrink-0 object-contain object-bottom sm:max-w-none sm:h-[150px] min-[768px]:max-[899px]:h-[170px] lg:h-[180px]"
                  />
                </div>
              </div>
            </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
