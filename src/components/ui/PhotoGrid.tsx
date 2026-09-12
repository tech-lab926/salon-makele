"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, User as UserIcon, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

export interface GridCase {
  id: string | number;
  title: string;
  beforeImgUrl: string | null;
  afterImgUrl: string | null;
  category: { name: string };
  artist: { id: string | number; displayName: string; profileImgUrl: string | null };
  isSponsored?: boolean;
}

interface PhotoGridProps {
  cases: GridCase[];
  /** /cases & search (症例): 2 cols through iPad Mini/Air (≤820px viewport band); 3 cols from 821px+. Other pages keep default breakpoints. */
  variant?: "default" | "casesListing";
}

function GridItemCard({ c, safeId, href }: { c: GridCase; safeId: string | null; href: string }) {
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!safeId || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "case", targetId: safeId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavorited(data.favorited);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "お気に入りの更新に失敗しました。ログイン状態をご確認ください。");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group relative">
      <Link
        href={href}
        className="relative block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
      >
        {/* Before / After — fills the upper area (no hollow gradient middle) */}
        <div className="relative bg-gray-200">
          {c.isSponsored && (
            <div className="absolute left-0 top-0 z-20 h-[50px] w-[50px] overflow-hidden">
              <div className="absolute left-[-20px] top-[10px] w-[80px] -rotate-45 bg-gradient-to-r from-gray-700 to-gray-900 py-0.5 text-center text-[8px] font-bold tracking-widest text-white shadow-sm">
                PR
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-px">
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
              {c.beforeImgUrl ? (
                <Image
                  src={c.beforeImgUrl}
                  alt={`${c.title} 施術前`}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 639px) 46vw, (max-width: 767px) 24vw, 18vw"
                  loading="lazy"
                 unoptimized={true} />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gray-100 px-2 text-center">
                  <ImageIcon className="h-6 w-6 text-gray-300" aria-hidden />
                  <span className="text-[9px] font-medium text-gray-400">施術前</span>
                </div>
              )}
              <span className="absolute left-1 top-1 rounded bg-black/65 px-1.5 py-0.5 text-[8px] font-bold text-white">
                施術前
              </span>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
              {c.afterImgUrl ? (
                <Image
                  src={c.afterImgUrl}
                  alt={`${c.title} 施術後`}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 639px) 46vw, (max-width: 767px) 24vw, 18vw"
                  loading="lazy"
                 unoptimized={true} />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gray-100 px-2 text-center">
                  <ImageIcon className="h-6 w-6 text-gray-300" aria-hidden />
                  <span className="text-[9px] font-medium text-gray-400">施術後</span>
                </div>
              )}
              <span className="absolute right-1 top-1 rounded bg-[#c2185b]/90 px-1.5 py-0.5 text-[8px] font-bold text-white">
                施術後
              </span>
            </div>
          </div>

          <button
            type="button"
            className={`absolute bottom-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm transition-all group/btn ${favorited ? 'bg-white text-[#c2185b]' : 'bg-black/35 hover:bg-white/90 text-white'}`}
            aria-label="お気に入り"
            onClick={toggleFavorite}
            disabled={loading}
          >
            <Heart
              className={`h-4 w-4 shrink-0 transition-[fill,stroke] duration-200 ${favorited ? 'fill-[#c2185b] stroke-[#c2185b]' : 'fill-transparent stroke-current stroke-[1.75] group-hover/btn:fill-[#c2185b] group-hover/btn:stroke-[#c2185b]'}`}
            />
          </button>
        </div>

        <div className="border-t border-gray-100 p-2 sm:p-2.5">
          <span className="inline-block rounded-full bg-[#c2185b] px-1.5 py-0.5 text-[8px] font-bold text-white sm:text-[9px] sm:px-2">
            {c.category.name}
          </span>
          <h3 className="mt-1 line-clamp-2 text-[11px] font-bold leading-snug text-gray-900 sm:mt-1.5 sm:text-xs">{c.title}</h3>
          <div className="mt-1.5 flex min-w-0 items-center gap-2 sm:mt-2 sm:gap-2.5">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-50 sm:h-[53px] sm:w-[53px]">
              {c.artist.profileImgUrl ? (
                <Image
                  src={c.artist.profileImgUrl}
                  alt={c.artist.displayName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 40px, 53px"
                 unoptimized={true} />
              ) : (
                <UserIcon className="h-full w-full p-1 text-gray-300" />
              )}
            </div>
            <span className="min-w-0 truncate text-[10px] font-medium text-gray-600 sm:text-[11px]">{c.artist.displayName}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function PhotoGrid({ cases, variant = "default" }: PhotoGridProps) {
  if (!cases || cases.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-gray-500">
        写真が見つかりません
      </div>
    );
  }

  /* casesListing columns: globals.css `.cases-listing-photo-grid` (plain @media — Tailwind sm/md/max compounds omit or lose at ~820px / iPad Air). */
  const gridClass =
    variant === "casesListing"
      ? "cases-listing-photo-grid grid gap-2.5 min-[640px]:gap-3"
      : "grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 md:grid-cols-3";

  return (
    <div className={gridClass}>
      {cases.map((c, idx) => {
        // Guard against undefined/null ids to prevent broken <Link> hrefs
        const safeId = c.id != null ? c.id.toString() : null;
        const href = safeId ? `/cases/${safeId}` : "#";

        return (
          <GridItemCard key={safeId ?? `dummy-${idx}`} c={c} safeId={safeId} href={href} />
        );
      })}
    </div>
  );
}
