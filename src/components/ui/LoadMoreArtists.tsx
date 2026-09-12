"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ArtistDirectoryCard from "@/components/artists/ArtistDirectoryCard";

interface ArtistListItem {
  id: string;
  displayName: string;
  profileImgUrl: string | null;
  viewCount: number;
  caseCount: number;
  clinicName: string | null;
  area: { id: string; prefecture: string; city: string | null };
  skills: { id: string; name: string; slug: string }[];
}

interface LoadMoreArtistsProps {
  initialArtists: ArtistListItem[];
  totalPages: number;
}

export default function LoadMoreArtists({ initialArtists, totalPages }: LoadMoreArtistsProps) {
  const searchParams = useSearchParams();
  const [artists, setArtists] = useState<ArtistListItem[]>(initialArtists);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setArtists(initialArtists);
    setPage(1);
  }, [initialArtists, searchParams]);

  const hasMore = page < totalPages;

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    
    const query = new URLSearchParams(searchParams.toString());
    query.set("page", String(nextPage));
    
    try {
      const res = await fetch(`/api/artists?${query.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setArtists((prev) => [...prev, ...json.data]);
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Failed to load more artists", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 min-[768px]:max-[900px]:gap-6 xl:grid-cols-3">
        {artists.map((artist, index) => (
          <ArtistDirectoryCard
            key={artist.id}
            index={index}
            artist={artist}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-14 flex justify-center">
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
