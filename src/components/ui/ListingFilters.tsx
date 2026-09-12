"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface FilterOption {
  id: string;
  label: string;
}

interface ListingFiltersProps {
  categories?: FilterOption[];
  areas?: FilterOption[];
  showSort?: boolean;
  sortOptions?: { value: string; label: string }[];
  categoryParamKey?: string;
  /** When set, shows a control that clears all query params on the current path (defaults). */
  showReset?: boolean;
  resetLabel?: string;
}

const defaultSortOptions = [
  { value: "ranking", label: "人気順" },
  { value: "newest", label: "新着順" },
];

export default function ListingFilters({
  categories,
  areas,
  showSort = true,
  sortOptions = defaultSortOptions,
  categoryParamKey = "categoryId",
  showReset = false,
  resetLabel = "フィルターをリセット",
}: ListingFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Cross-delete to prevent conflicting filters
    if (key === "categoryId") params.delete("category");
    if (key === "category") params.delete("categoryId");
    
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  if (!isMounted) return null;

  const selectClass =
    "appearance-none rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-sm text-gray-700 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%239CA3AF%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27m6%208%204%204%204-4%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.125rem_1.125rem] bg-[position:right_0.5rem_center] bg-no-repeat";

  // Find active category across both ID and slug params
  const activeCategory = searchParams.get("categoryId") || searchParams.get("category") || "";

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {categories && (
        <select
          value={activeCategory}
          onChange={(e) => updateFilter(categoryParamKey, e.target.value)}
          className={selectClass}
        >
          <option value="">すべてのカテゴリ</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      )}

      {areas && (
        <select
          value={searchParams.get("areaId") || ""}
          onChange={(e) => updateFilter("areaId", e.target.value)}
          className={selectClass}
        >
          <option value="">すべてのエリア</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      )}

      {showSort && (
        <select
          value={searchParams.get("sort") || sortOptions[0]?.value || ""}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className={selectClass}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}

      {showReset && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="rounded-lg border border-[#e9e1e6] bg-white px-3 py-1.5 text-sm font-medium text-[#75676d] transition-colors hover:border-[#c2185b] hover:text-[#c2185b]"
        >
          {resetLabel}
        </button>
      )}
    </div>
  );
}
