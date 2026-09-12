"use client";

import { useRef, useMemo, memo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import ArtistPremiumCard from "@/components/home/ArtistPremiumCard";

/** Shape produced by `getCachedHomeData()` for each popular artist */
export interface HomePopularArtist {
  id: bigint | string | number;
  displayName: string;
  profileImgUrl: string | null;
  bio: string | null;
  area: { prefecture: string; city: string | null };
  skills: { category: { name: string } }[];
  menus: { id: bigint | string | number; name: string; price: number | null }[];
  cases: { id: bigint | string | number; title: string; afterImgUrl: string }[];
  stats: { rating: number; reviewCount: number; likeCount: number };
}

function toPremiumArtistPayload(a: HomePopularArtist) {
  return {
    id: String(a.id),
    displayName: a.displayName,
    profileImgUrl: a.profileImgUrl,
    bio: a.bio,
    area: {
      prefecture: a.area.prefecture,
      city: a.area.city,
    },
    skills: a.skills,
    stats: a.stats,
    menus: a.menus.map((m) => ({
      ...m,
      id: String(m.id),
    })),
    cases: a.cases.map((c) => ({
      ...c,
      id: String(c.id),
    })),
  };
}

interface PopularArtistsSectionProps {
  artists: readonly HomePopularArtist[];
}

function PopularArtistsSection({ artists }: PopularArtistsSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const memoizedArtists = useMemo(() => 
    artists.map(a => toPremiumArtistPayload(a)),
    [artists]
  );

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 360;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!artists.length) return null;

  return (
    <section className="bg-gray-50 py-8 sm:py-5 lg:py-6">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
        <div className="mx-auto max-w-5xl max-lg:px-0 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold leading-tight text-gray-900 sm:text-xl">人気アーティスト</h2>
              <p className="text-sm leading-snug text-gray-500">注目のアートメイクアーティスト</p>
            </div>
            <Link
              href="/artists"
              className="flex shrink-0 items-center gap-1 pt-0.5 text-sm font-medium text-[#c2185b] hover:underline sm:pt-1"
            >
              すべて見る <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-start group/nav lg:hidden">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="mr-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c2185b] text-white shadow-md transition-all hover:scale-110 hover:bg-[#880e4f] active:scale-95 xl:flex"
              aria-label="前のアーティスト"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="relative min-w-0 flex-1 lg:flex-none lg:w-fit lg:max-w-full lg:overflow-hidden">
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-2 [touch-action:pan-x_pan-y] [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory pl-0 max-lg:pr-6 sm:gap-6 lg:px-4 max-lg:w-[calc(100%+1.5rem)] max-lg:-mr-6 [&::-webkit-scrollbar]:hidden"
              >
                {memoizedArtists.map((a) => (
                  <div
                    key={a.id}
                    className="w-[min(82vw,_320px)] max-w-[320px] shrink-0 snap-start flex-none sm:max-w-[360px] lg:snap-center"
                  >
                    <ArtistPremiumCard artist={a} />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => scroll("right")}
              className="ml-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c2185b] text-white shadow-md transition-all hover:scale-110 hover:bg-[#880e4f] active:scale-95 xl:flex"
              aria-label="次のアーティスト"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Desktop: unchanged 2-column grid */}
        <div className="mx-auto mt-6 hidden max-w-5xl gap-4 px-4 sm:gap-5 sm:px-6 lg:grid lg:grid-cols-2 lg:gap-5 lg:px-8">
          {memoizedArtists.map((a) => (
            <ArtistPremiumCard key={a.id} artist={a} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default memo(PopularArtistsSection);
