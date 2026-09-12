import Link from "next/link";
import Image from "next/image";
import { Star, MessageCircle, Heart, MapPin, ArrowRight } from "lucide-react";
import { getOptimizedMediaUrl } from "@/lib/utils";
import DefaultAvatar from "@/components/ui/DefaultAvatar";

interface ArtistPremiumCardProps {
  artist: {
    id: string;
    displayName: string;
    profileImgUrl: string | null;
    bio: string | null;
    area: { prefecture: string; city: string | null };
    skills: { category: { name: string } }[];
    stats: {
      rating: number;
      reviewCount: number;
      likeCount: number;
    };
    menus: { id: string; name: string; price: number | null }[];
    cases: { id: string; title: string; afterImgUrl: string }[];
  };
}

const formatPrice = (price: number | null) => {
  if (price === null) return "要相談";
  return `¥${price.toLocaleString()}`;
};

export default function ArtistPremiumCard({ artist }: ArtistPremiumCardProps) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 sm:p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1">
      {/* Header section */}
      <div className="flex items-start gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-pink-50 ring-2 ring-pink-50/50 sm:h-[66px] sm:w-[66px]">
          {artist.profileImgUrl ? (
            <Image
              src={getOptimizedMediaUrl(artist.profileImgUrl)}
              alt={artist.displayName}
              fill
              sizes="66px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <DefaultAvatar />
          )}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[17px] sm:text-[18px] font-bold text-gray-900 leading-tight">
              {artist.displayName}
            </h3>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-500 tracking-wider">
              OFFICIAL
            </span>
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-gray-400">
            経験年数 3年以上 {/* Placeholder as not in DB */}
          </p>

          {/* Stats Bar — slightly tighter horizontal gap on mobile so counts stay inside the card on real devices */}
          <div className="mt-1.5 flex items-center gap-1.5 sm:gap-2.5">
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => {
                  const rating = artist.stats.rating || 4.5;
                  const isFull = i < Math.floor(rating);
                  const isHalf = i === Math.floor(rating) && rating % 1 !== 0;

                  return (
                    <div key={i} className="relative">
                      {isHalf ? (
                        <div className="relative h-3.5 w-3.5">
                          {/* Background star */}
                          <Star className="absolute inset-0 h-3.5 w-3.5 fill-gray-200 text-gray-200" />
                          {/* Half filled star on top */}
                          <div className="absolute inset-0 overflow-hidden w-[50%]">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          </div>
                        </div>
                      ) : (
                        <Star
                          className={`h-3.5 w-3.5 ${
                            isFull
                              ? "fill-yellow-400 text-yellow-400"
                              : "fill-gray-200 text-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <span className="text-[13px] font-bold text-gray-700 ml-1">
                {artist.stats.rating > 0 ? artist.stats.rating.toFixed(1) : "4.5"}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 text-gray-700">
              <MessageCircle className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-bold">{artist.stats.reviewCount || 120}</span>
            </div>

            <div className="flex items-center gap-1.5 text-gray-700">
              <Heart className="h-4 w-4 fill-pink-500 text-pink-500 transition-transform group-hover:scale-110" />
              <span className="text-xs font-bold">{artist.stats.likeCount || 450}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tags section */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-500 border border-blue-100/50">
          <span className="mr-0.5 text-[11px]">✨</span> 症例が豊富
        </span>
        {artist.skills.length > 0 && (
          <span className="inline-flex items-center rounded-full bg-[#FFF3F6] px-2 py-0.5 text-[10px] font-medium text-[#D85F7E]">
            {artist.skills.slice(0, 3).map((s) => s.category.name).join(" / ")}
          </span>
        )}
      </div>

      {/* Bio section — wider line-length via narrower card; allow more lines */}
      <p className="mt-2 line-clamp-[5] text-[12px] leading-relaxed text-gray-700 sm:line-clamp-none">
        {artist.bio || "理想のデザインを全力でプロデュースいたします。お気軽にご相談ください。"}
      </p>

      {/* Gallery Section */}
      <div className="mt-auto pt-2.5 flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide snap-x items-stretch [touch-action:pan-x_pan-y]">
        {artist.cases.length > 0 ? (
          artist.cases.map((c, idx) => (
            <Link 
              key={c.id} 
              href={`/cases/${c.id}`}
              className="w-[198px] shrink-0 snap-start flex h-[72px] items-stretch rounded-lg border border-gray-100 bg-white overflow-hidden shadow-sm transition-all hover:border-pink-200 hover:shadow-md active:scale-95 sm:w-[210px] sm:h-[76px]"
            >
              {/* Image Left */}
              <div className="relative w-[72px] shrink-0 bg-gray-50 border-r border-gray-50 sm:w-[76px]">
                <Image src={getOptimizedMediaUrl(c.afterImgUrl)} alt={c.title} fill sizes="76px" className="object-cover" />
                <div className="absolute top-1 left-1">
                  <span className="bg-[#ff4d8d] text-white text-[7px] font-bold px-1 py-0.5 rounded shadow-sm">
                    症例
                  </span>
                </div>
              </div>
              
              {/* Content Right */}
              <div className="flex flex-1 flex-col justify-between p-1.5 min-w-0">
                <div className="space-y-1">
                  {/* Badges Row */}
                  <div className="flex gap-1">
                    <span className="bg-pink-100 text-[#ff4d8d] text-[8px] font-extrabold px-1 py-0.5 rounded-sm">
                      新規
                    </span>
                    <span className="bg-sky-100 text-sky-600 text-[8px] font-extrabold px-1 py-0.5 rounded-sm whitespace-nowrap">
                      限定
                    </span>
                  </div>
                  {/* Title */}
                  <h4 className="text-[10px] font-bold text-gray-800 line-clamp-2 leading-[1.3]">
                    {c.title}
                  </h4>
                </div>
                {/* Price */}
                <div className="text-right">
                  <span className="text-[13px] font-black text-[#ff4d8d]">
                    {formatPrice(artist.menus[idx]?.price || (artist.menus[0]?.price && idx > 0 ? artist.menus[0].price : null))}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="w-full rounded-xl border border-dashed border-gray-200 py-6 text-center text-[10px] text-gray-400">
            実績データがありません
          </div>
        )}
      </div>




      {/* Footer section */}
      <div className="mt-2.5 flex items-end justify-between border-t border-gray-50 pt-2">
        <div className="flex items-center gap-1.5 text-gray-500">
          <MapPin className="h-3.5 w-3.5 text-pink-400" />
          <span className="text-[11px] font-medium">
            {artist.area.prefecture} {artist.area.city || ""}
          </span>
        </div>
        <Link
          href={`/artists/${artist.id}`}
          className="inline-flex items-center gap-1 rounded-md bg-[#c2185b] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#a3154d] hover:shadow-md active:scale-95 sm:text-[13px] sm:px-3.5"
        >
          詳細を見る
        </Link>

      </div>
    </div>
  );
}
