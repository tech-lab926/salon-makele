"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import PhotoGrid, { GridCase } from "./PhotoGrid";

interface LoadMoreCasesProps {
  initialCases: GridCase[];
  totalPages: number;
}

export default function LoadMoreCases({ initialCases, totalPages }: LoadMoreCasesProps) {
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<GridCase[]>(initialCases);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Reset when search filters change (which changes initialCases and URL)
  useEffect(() => {
    setCases(initialCases);
    setPage(1);
  }, [initialCases, searchParams]);

  const hasMore = page < totalPages;

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    
    // Construct query string based on current search params
    const query = new URLSearchParams(searchParams.toString());
    query.set("page", String(nextPage));
    
    try {
      const res = await fetch(`/api/cases?${query.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCases((prev) => [...prev, ...json.data]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Failed to load more cases", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mt-6">
        <PhotoGrid cases={cases as any} variant="casesListing" />
      </div>

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex min-w-[200px] items-center justify-center gap-2 rounded-full border border-[#d487a0] bg-white px-8 py-3 text-[14px] font-bold text-[#c2185b] shadow-[0_4px_12px_rgba(194,24,91,0.08)] transition-all hover:bg-[#fff5f8] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                読み込み中...
              </>
            ) : (
              "もっと見る"
            )}
          </button>
        </div>
      )}
    </>
  );
}
