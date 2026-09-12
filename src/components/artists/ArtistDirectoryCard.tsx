"use client";

import { memo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin, Star, Award, Search, ChevronRight } from "lucide-react";
import DefaultAvatar from "@/components/ui/DefaultAvatar";
import toast from "react-hot-toast";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export type ArtistDirectoryCardArtist = {
  id: string;
  displayName: string;
  clinicName?: string | null;
  profileImgUrl: string | null;
  viewCount: number;
  caseCount: number;
  area: { prefecture: string; city: string | null };
  skills: { name: string; slug: string }[];
  isSponsored?: boolean;
};

function formatPopularityScore(artist: Pick<ArtistDirectoryCardArtist, "caseCount" | "viewCount">) {
  const score = 4.45 + Math.min(0.45, artist.caseCount / 50 + artist.viewCount / 6000);
  return Math.min(4.9, score).toFixed(1);
}

function formatReviewCount(artist: Pick<ArtistDirectoryCardArtist, "caseCount" | "viewCount">) {
  return Math.max(18, Math.round(artist.caseCount * 7 + artist.viewCount / 12));
}

function formatAreaLabel(area: ArtistDirectoryCardArtist["area"]) {
  if (area.city) return `${area.prefecture} ${area.city}`;
  return area.prefecture;
}

interface ArtistDirectoryCardProps {
  artist: ArtistDirectoryCardArtist;
  /** First card shows the 「おすすめ」 ribbon (matches /artists listing). */
  index?: number;
}

const ArtistDirectoryCard = memo(function ArtistDirectoryCard({ artist, index = 0 }: ArtistDirectoryCardProps) {
  const popularityScore = formatPopularityScore(artist);
  const reviewCount = formatReviewCount(artist);
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: favoriteData } = useSWR("/api/favorites?targetType=artist", fetcher, {
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (favoriteData?.favorites) {
      setFavorited(favoriteData.favorites.some((f: { targetId: string }) => f.targetId === artist.id));
    }
  }, [favoriteData, artist.id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "artist", targetId: artist.id }),
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
    <div className="relative">
      <Link
        href={`/artists/${artist.id}`}
        className="group flex flex-col overflow-hidden rounded-[20px] border border-[#f2e6ea] bg-white shadow-[0_4px_16px_rgba(194,24,91,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(194,24,91,0.08)]"
      >
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-[#f6f0f2] sm:aspect-square">
          {artist.profileImgUrl ? (
            <Image
              src={artist.profileImgUrl}
              alt={`${artist.displayName}のプロフィール写真`}
              fill
              sizes="(max-width: 639px) 100vw, (max-width: 1280px) 50vw, 260px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
             unoptimized={true} />
          ) : (
            <DefaultAvatar />
          )}

          {artist.isSponsored ? (
            <div className="absolute left-0 top-0 z-10 h-[80px] w-[80px] overflow-hidden">
              <div className="absolute left-[-28px] top-[18px] w-[120px] -rotate-45 bg-gradient-to-r from-gray-700 to-gray-900 py-1 text-center text-[10px] font-bold tracking-widest text-white shadow-sm min-[768px]:max-[820px]:text-[11px]">
                PR
              </div>
            </div>
          ) : index === 0 ? (
            <div className="absolute left-0 top-0 z-10 h-[80px] w-[80px] overflow-hidden">
              <div className="absolute left-[-28px] top-[18px] w-[120px] -rotate-45 bg-gradient-to-r from-[#e37d9c] to-[#d56d8d] py-1 text-center text-[10px] font-bold tracking-widest text-white shadow-sm min-[768px]:max-[820px]:text-[11px]">
                おすすめ
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col px-4 pb-4 pt-4 min-[768px]:max-[820px]:px-5 min-[768px]:max-[820px]:pb-5 min-[768px]:max-[820px]:pt-5">
          <h3 className="text-[18px] font-bold tracking-tight text-gray-900 min-[768px]:max-[820px]:text-[20px]">
            {artist.displayName} <span className="text-[14px] font-medium text-gray-600 min-[768px]:max-[820px]:text-[16px]">さん</span>
          </h3>
          <p className="mt-1.5 text-[12px] text-gray-600 min-[768px]:max-[820px]:text-[14px]">
            {artist.clinicName || "所属クリニック未設定"}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[12px] text-gray-500 min-[768px]:max-[820px]:gap-1.5 min-[768px]:max-[820px]:text-[14px]">
            <MapPin className="h-3.5 w-3.5 shrink-0 min-[768px]:max-[820px]:h-4 min-[768px]:max-[820px]:w-4" />
            <span>{formatAreaLabel(artist.area)}</span>
          </p>

          {artist.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap">
              <span className="rounded-full bg-[#FFF3F6] px-2.5 py-0.5 text-[10px] font-medium text-[#D85F7E] min-[768px]:max-[820px]:px-3 min-[768px]:max-[820px]:py-1 min-[768px]:max-[820px]:text-[12px]">
                {artist.skills.map((s) => s.name).join(" / ")}
              </span>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-[12px] min-[768px]:max-[820px]:text-[14px]">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-current text-[#c2185b] min-[768px]:max-[820px]:h-4 min-[768px]:max-[820px]:w-4" />
              <span className="font-bold text-[#c2185b]">{popularityScore}</span>
              <span className="font-normal text-gray-400">({reviewCount}件)</span>
            </div>
            <span className="text-gray-500">症例数 {artist.caseCount}件</span>
          </div>

          <div className="mt-auto pt-5">
            <div className="relative flex h-[34px] w-full items-stretch overflow-hidden rounded-full border border-[#f2dfe6] bg-[#fff8fa] transition group-hover:border-[#e8c8d5] group-hover:bg-[#fff0f5] min-[768px]:max-[820px]:h-[38px]">
              <div className="flex flex-1 items-center justify-center text-[12px] font-bold text-[#d56d8d] pl-4 min-[768px]:max-[820px]:text-[14px]">
                詳細を見る
              </div>
              <div className="relative flex h-full w-[42px] shrink-0 items-center justify-center bg-white transition group-hover:bg-gray-50 min-[768px]:max-[820px]:w-11">
                <div className="absolute -left-[54px] top-1/2 h-[60px] w-[60px] -translate-y-1/2 rounded-full bg-[#fff8fa] transition group-hover:bg-[#fff0f5]" />
                <Heart className={`relative z-10 h-3.5 w-3.5 transition group-hover:scale-110 ${favorited ? 'fill-[#c2185b] text-[#c2185b]' : 'text-[#d7aab8]'}`} />
              </div>
            </div>
          </div>
        </div>
      </Link>

      <button
        type="button"
        aria-label="お気に入り"
        className={`absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition hover:scale-110 min-[768px]:max-[820px]:right-4 min-[768px]:max-[820px]:top-4 min-[768px]:max-[820px]:h-10 min-[768px]:max-[820px]:w-10 ${favorited ? 'text-[#c2185b]' : 'text-[#d7aab8]'}`}
        onClick={toggleFavorite}
        disabled={loading}
      >
        <Heart className={`h-4 w-4 min-[768px]:max-[820px]:h-[18px] min-[768px]:max-[820px]:w-[18px] ${favorited ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
});

export default ArtistDirectoryCard;
