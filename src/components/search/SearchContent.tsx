"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import PhotoGrid from "@/components/ui/PhotoGrid";
import ArtistDirectoryCard from "@/components/artists/ArtistDirectoryCard";

interface Category {
  id: string;
  name: string;
  slug: string;
  techniques?: { id: string; name: string }[];
}

interface Area {
  id: string;
  prefecture: string;
}

interface CaseResult {
  id: string;
  title: string;
  beforeImgUrl: string | null;
  afterImgUrl: string | null;
  artist: { id: string; displayName: string; profileImgUrl: string | null };
  category: { name: string; slug: string };
  technique: { name: string } | null;
  isSponsored?: boolean;
}

interface ArtistResult {
  id: string;
  displayName: string;
  profileImgUrl: string | null;
  viewCount: number;
  caseCount: number;
  clinicName: string | null;
  area: { prefecture: string; city: string | null };
  skills: { name: string; slug: string }[];
  isSponsored?: boolean;
}

let staticFiltersPromise: Promise<{ categories: Category[]; areas: Area[] }> | null = null;

async function getStaticFilters(): Promise<{ categories: Category[]; areas: Area[] }> {
  if (!staticFiltersPromise) {
    staticFiltersPromise = Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/areas").then((r) => r.json()),
    ]).then(([catData, areaData]) => ({
      categories: catData.success ? (catData.data as Category[]) : [],
      areas: areaData.success ? (areaData.data as Area[]) : [],
    }));
  }
  return staticFiltersPromise;
}


export default function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [type, setType] = useState<"cases" | "artists">(
    (searchParams.get("type") as "cases" | "artists") || "cases",
  );
  const [categorySlug, setCategorySlug] = useState(
    searchParams.get("category") || "",
  );
  const [areaId, setAreaId] = useState(searchParams.get("areaId") || "");
  const [techniqueId, setTechniqueId] = useState(searchParams.get("techniqueId") || "");

  const [categories, setCategories] = useState<Category[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [caseResults, setCaseResults] = useState<CaseResult[]>([]);
  const [artistResults, setArtistResults] = useState<ArtistResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const isInitialMount = useRef(true);
  const searchAbortRef = useRef<AbortController | null>(null);
  /** Last successful “no filters” response per tab — reset can restore without refetching. */
  const defaultListingRef = useRef<{
    cases: { items: CaseResult[]; total: number } | null;
    artists: { items: ArtistResult[]; total: number } | null;
  }>({ cases: null, artists: null });
  /** When true, the next [type, categorySlug, areaId] effect skips performSearch (clear/replace handled). */
  const skipNextFilterEffectRef = useRef(false);

  useEffect(() => {
    getStaticFilters().then(({ categories: nextCategories, areas: nextAreas }) => {
      setCategories(nextCategories);
      setAreas(nextAreas);
    });

    // Always trigger Initial search on mount
    performSearch({
      q: query,
      searchType: type,
      category: categorySlug,
      area: areaId,
    });

    return () => {
      searchAbortRef.current?.abort();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (skipNextFilterEffectRef.current) {
      skipNextFilterEffectRef.current = false;
      return;
    }
    performSearch({
      q: query,
      searchType: type,
      category: categorySlug,
      area: areaId,
      technique: techniqueId,
    });
  }, [type, categorySlug, areaId, techniqueId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function performSearch(opts: {
    q: string;
    searchType: string;
    category: string;
    area: string;
    technique?: string;
  }) {
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setLoading(true);
    setHasSearched(true);

    try {
      let data;

      if (opts.searchType === "cases") {
        // Use /api/cases directly — it works correctly with the current setup
        const params = new URLSearchParams();
        if (opts.category) params.set("category", opts.category);
        if (opts.area) params.set("areaId", opts.area);
        if (opts.technique) params.set("techniqueId", opts.technique);
        if (opts.q) params.set("q", opts.q);
        params.set("limit", "24");
        const res = await fetch(`/api/cases?${params.toString()}`, {
          signal: controller.signal,
        });
        data = await res.json();
      } else {
        // Artists — use /api/artists directly
        const params = new URLSearchParams();
        if (opts.q) params.set("q", opts.q);
        if (opts.category) params.set("category", opts.category);
        if (opts.area) params.set("areaId", opts.area);
        params.set("limit", "24");
        const res = await fetch(`/api/artists?${params.toString()}`, {
          signal: controller.signal,
        });
        data = await res.json();
      }

      if (controller.signal.aborted) return;

      if (data.success) {
        if (opts.searchType === "cases") {
          setCaseResults(data.data as CaseResult[]);
          setArtistResults([]);
        } else {
          setArtistResults(data.data as ArtistResult[]);
          setCaseResults([]);
        }
        setTotal(data.pagination.total);

        const noFilters =
          !opts.category && !opts.area && !opts.technique && !(opts.q && opts.q.trim());
        if (noFilters) {
          if (opts.searchType === "cases") {
            defaultListingRef.current.cases = {
              items: data.data as CaseResult[],
              total: data.pagination.total as number,
            };
          } else {
            defaultListingRef.current.artists = {
              items: data.data as ArtistResult[],
              total: data.pagination.total as number,
            };
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      // ignore
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }

    if (controller.signal.aborted) return;

    const url = new URLSearchParams();
    if (opts.q) url.set("q", opts.q);
    url.set("type", opts.searchType);
    if (opts.category) url.set("category", opts.category);
    if (opts.area) url.set("areaId", opts.area);
    if (opts.technique) url.set("techniqueId", opts.technique);
    router.replace(`/search?${url.toString()}`, { scroll: false });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    performSearch({
      q: query,
      searchType: type,
      category: categorySlug,
      area: areaId,
    });
  }

  function handleClearFilters() {
    const hadStructuredFilters = categorySlug !== "" || areaId !== "";

    setQuery("");
    setCategorySlug("");
    setAreaId("");
    setTechniqueId("");

    if (type === "cases") {
      const cached = defaultListingRef.current.cases;
      if (cached) {
        if (hadStructuredFilters) {
          skipNextFilterEffectRef.current = true;
        }
        setCaseResults(cached.items);
        setArtistResults([]);
        setTotal(cached.total);
        router.replace(`/search?type=${type}`, { scroll: false });
        return;
      }
    } else {
      const cached = defaultListingRef.current.artists;
      if (cached) {
        if (hadStructuredFilters) {
          skipNextFilterEffectRef.current = true;
        }
        setArtistResults(cached.items);
        setCaseResults([]);
        setTotal(cached.total);
        router.replace(`/search?type=${type}`, { scroll: false });
        return;
      }
    }

    if (hadStructuredFilters) {
      skipNextFilterEffectRef.current = true;
    }
    void performSearch({
      q: "",
      searchType: type,
      category: "",
      area: "",
      technique: "",
    });
  }

  const hasActiveFilters =
    categorySlug !== "" || areaId !== "" || techniqueId !== "" || query.trim() !== "";

  const selectClass =
    "min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-700 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b] sm:px-4 sm:text-sm";

  return (
    <div className="mx-auto w-full max-w-[calc(1000px+4rem)] px-6 py-8 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">検索</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-500 sm:mt-2">
        カテゴリ、エリア、キーワードで検索できます
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:mt-6 sm:rounded-2xl sm:p-5"
      >
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch sm:gap-2">
          <div className="relative min-w-0 w-full sm:flex-[5]">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 sm:left-3 sm:h-[1.125rem] sm:w-[1.125rem]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="キーワードで検索..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-[13px] outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b] sm:py-2.5 sm:pl-10 sm:pr-4 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-lg bg-[#c2185b] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#880e4f] disabled:opacity-50 sm:h-auto sm:min-w-[6.25rem] sm:w-auto sm:flex-1 sm:self-stretch sm:px-6"
          >
            {loading ? <Loader2 className="h-[1.125rem] w-[1.125rem] animate-spin sm:h-5 sm:w-5" /> : "検索"}
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <select
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className={selectClass}
          >
            <option value="">すべてのカテゴリ</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {type === "cases" && categorySlug && (
            <select
              value={techniqueId}
              onChange={(e) => setTechniqueId(e.target.value)}
              className={selectClass}
            >
              <option value="">すべての技法</option>
              {categories
                .find((c) => c.slug === categorySlug)
                ?.techniques?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          )}

          <select
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            className={selectClass}
          >
            <option value="">すべてのエリア</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.prefecture}
              </option>
            ))}
          </select>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={loading}
              className="shrink-0 rounded-lg border border-[#e9e1e6] bg-white px-3 py-2 text-[13px] font-medium text-[#75676d] transition-colors hover:border-[#c2185b] hover:text-[#c2185b] disabled:opacity-50 sm:py-1.5 sm:text-sm"
            >
              フィルターをリセット
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-5 flex gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5 sm:mt-6 sm:gap-1 sm:p-1">
        {(["cases", "artists"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors sm:px-4 sm:py-2 sm:text-sm ${
              type === t
                ? "bg-white text-[#c2185b] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "cases" ? "症例" : "アーティスト"}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="mt-5 sm:mt-6">
        <div className="flex flex-wrap items-baseline gap-1">
          <span className="text-[13px] font-medium text-gray-700 sm:text-sm">検索結果：</span>
          <span className="text-[22px] font-bold leading-none text-[#d56d8d] sm:text-[28px]">{total}</span>
          <span className="text-[13px] font-medium text-gray-600 sm:text-sm">件</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
          </div>
        ) : type === "cases" && caseResults.length > 0 ? (
          <div className="mt-5 sm:mt-6">
            <PhotoGrid
              variant="casesListing"
              cases={caseResults.map((c) => ({
                id: c.id,
                title: c.title,
                beforeImgUrl: c.beforeImgUrl,
                afterImgUrl: c.afterImgUrl,
                category: { name: c.category.name },
                artist: {
                  id: c.artist.id,
                  displayName: c.artist.displayName,
                  profileImgUrl: c.artist.profileImgUrl,
                },
                isSponsored: c.isSponsored,
              }))}
            />
          </div>
        ) : type === "artists" && artistResults.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {artistResults.map((a, index) => (
              <ArtistDirectoryCard
                key={a.id}
                index={index}
                artist={{
                  id: a.id,
                  displayName: a.displayName,
                  profileImgUrl: a.profileImgUrl,
                  viewCount: a.viewCount,
                  caseCount: a.caseCount,
                  clinicName: a.clinicName,
                  area: a.area,
                  skills: a.skills,
                  isSponsored: a.isSponsored,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Search className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">検索結果がありません</p>
            <p className="mt-1 text-sm text-gray-400">
              キーワードや条件を変えてお試しください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
