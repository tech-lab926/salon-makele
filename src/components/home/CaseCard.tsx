"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, ImageIcon } from "lucide-react";
import { getOptimizedMediaUrl } from "@/lib/utils";

interface Artist {
  id: string | bigint;
  displayName: string;
  profileImgUrl: string | null;
  area: { prefecture: string; city: string | null };
}

interface Case {
  id: string | bigint;
  title: string;
  afterImgUrl: string;
  artist: Artist;
}

interface CaseCardProps {
  caseItem: Case;
}

/** Deterministic [0, 1) from a string (demo stats — applied only after mount to avoid RSC id / hydration quirks). */
function stableUnit(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function useDemoStats(caseId: string, artistId: string) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const seed = `${caseId}:${artistId}`;
  if (!ready) return null;
  return {
    experienceYears: Math.floor(stableUnit(`${seed}:exp`) * 10) + 3,
    reviewAvg: (4 + stableUnit(`${seed}:avg`)).toFixed(1),
    reviewCount: Math.floor(stableUnit(`${seed}:cnt`) * 1000) + 50,
  };
}

export default function CaseCard({ caseItem }: CaseCardProps) {
  const { artist } = caseItem;

  const demo = useDemoStats(String(caseItem.id), String(artist.id));
  const price = "¥20,900"; // Demo price

  return (
    <div className="group relative flex-none w-[80vw] max-w-[260px] sm:max-w-[300px] snap-center overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
      {/* Artist Profile Header (Top) */}
      <div className="flex items-center gap-3 p-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-100 sm:h-[66px] sm:w-[66px]">
          {artist.profileImgUrl ? (
            <Image
              src={getOptimizedMediaUrl(artist.profileImgUrl)}
              alt={artist.displayName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 56px, 66px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-pink-50 text-pink-200">
               <ImageIcon className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <h4 className="truncate text-[13px] font-bold text-gray-900">{artist.displayName}</h4>
          </div>
          <div className="text-[11px] text-gray-500">
            経験年数 {demo ? `${demo.experienceYears}年以上` : "—年以上"}
          </div>
          <div className="mt-0.5 flex items-center gap-1">
            <div className="flex text-orange-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[12px] font-bold text-gray-700">
                {demo ? demo.reviewAvg : "—"}
              </span>
              <span className="text-[11px] text-gray-400">
                ({demo ? demo.reviewCount : "—"})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Case Image ('Pasted' effect) */}
      <div className="px-2">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-50 border border-gray-50">
          <Image
            src={getOptimizedMediaUrl(caseItem.afterImgUrl)}
            alt={caseItem.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80vw, 300px"
          />
          {/* White overlay on hover (appears over image, below price overlay) */}
          <div className="absolute inset-0 bg-white/30 opacity-0 transition-opacity duration-200 group-hover:opacity-30 z-20" aria-hidden />
          {/* Price Tag Overlay */}
          <div className="absolute left-0 bottom-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 z-30">
            <div className="text-[10px] font-bold text-white line-clamp-1">{caseItem.title}</div>
            <div className="text-xs font-black text-white">{price}</div>
          </div>
        </div>
      </div>

      {/* Location Footer (Bottom) */}
      <div className="p-2">
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{artist.area.prefecture} {artist.area.city}</span>
        </div>
      </div>
      
      {/* Full link overlay */}
      <Link href={`/cases/${caseItem.id}`} className="absolute inset-0 z-20" aria-label={caseItem.title} />
    </div>
  );
}
