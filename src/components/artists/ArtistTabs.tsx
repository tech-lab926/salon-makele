"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Clock, ImageIcon, Loader2, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import DefaultAvatar from "@/components/ui/DefaultAvatar";

const PhotoLightbox = dynamic(() => import("@/components/ui/PhotoLightbox"), { ssr: false });

interface MenuData {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  durationMin: number;
  categoryName: string;
}

interface CaseData {
  id: string;
  title: string;
  beforeImgUrl: string;
  afterImgUrl: string;
  categoryName: string;
  techniqueName: string | null;
}

interface ProfileData {
  displayName: string;
  bio: string | null;
  profileImgUrl: string | null;
  area: string;
  caseCount: number;
  skills: string[];
}

interface Props {
  artistId: string;
  menus: MenuData[];
  profile: ProfileData;
  formatPrice: null;
}

const tabs = [
  { key: "top", label: "トップ" },
  { key: "menu", label: "メニュー" },
  { key: "photos", label: "フォト" },
  { key: "booking", label: "予約" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

function formatYen(price: number | null): string {
  if (price === null) return "要相談";
  return `¥${price.toLocaleString("ja-JP")}`;
}

export default function ArtistTabs({ artistId, menus, profile }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("top");

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="sticky top-16 z-10 -mx-4 border-b border-gray-200 bg-white/95 px-4 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-[#c2185b]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#c2185b]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="py-8">
        {activeTab === "top" && <TopTab profile={profile} />}
        {activeTab === "menu" && <MenuTab menus={menus} />}
        {activeTab === "photos" && <PhotosTab key={artistId} artistId={artistId} />}
        {activeTab === "booking" && <BookingTab artistId={artistId} />}
      </div>
    </div>
  );
}

function TopTab({ profile }: { profile: ProfileData }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-5">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm">
          {profile.profileImgUrl ? (
            <Image src={profile.profileImgUrl} alt={`${profile.displayName}のプロフィール写真`} width={80} height={80} className="h-full w-full object-cover"  unoptimized={true} />
          ) : (
            <DefaultAvatar />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{profile.displayName}</h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-4 w-4" /> {profile.area}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {profile.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-pink-200 bg-white px-3 py-1 text-xs font-medium text-[#c2185b]"
          >
            {skill}
          </span>
        ))}
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">
          症例 {profile.caseCount}件
        </span>
      </div>

      {profile.bio && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700">自己紹介</h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
            {profile.bio}
          </p>
        </div>
      )}
    </div>
  );
}

function MenuTab({ menus }: { menus: MenuData[] }) {
  if (menus.length === 0) {
    return (
      <p className="py-12 text-center text-gray-500">
        現在公開中のメニューはありません
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {menus.map((menu) => (
        <div
          key={menu.id}
          className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-medium text-[#c2185b]">
                {menu.categoryName}
              </span>
              <h3 className="mt-2 font-semibold text-gray-900">{menu.name}</h3>
              {menu.description && (
                <p className="mt-1 text-sm leading-relaxed text-gray-500">{menu.description}</p>
              )}
              <div className="mt-2 flex items-center gap-1 text-sm text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                <span>{menu.durationMin}分</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-lg font-bold text-[#c2185b]">{formatYen(menu.price)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PhotosTab({ artistId }: { artistId: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(false);
    fetch(`/api/cases?artistId=${encodeURIComponent(artistId)}&limit=30&sort=newest`, {
      signal: ac.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !Array.isArray(d.data)) {
          setError(true);
          return;
        }
        setCases(
          d.data.map(
            (row: {
              id: string;
              title: string;
              beforeImgUrl: string;
              afterImgUrl: string;
              category: { name: string };
              technique: { name: string } | null;
            }) => ({
              id: row.id,
              title: row.title,
              beforeImgUrl: row.beforeImgUrl,
              afterImgUrl: row.afterImgUrl,
              categoryName: row.category.name,
              techniqueName: row.technique?.name ?? null,
            }),
          ),
        );
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
    return () => ac.abort();
  }, [artistId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-12 text-center text-gray-500">
        症例の読み込みに失敗しました。しばらくしてからお試しください。
      </p>
    );
  }

  if (cases.length === 0) {
    return (
      <p className="py-12 text-center text-gray-500">
        現在公開中の症例写真はありません
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {cases.map((c, idx) => (
          <div key={c.id} className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
            <button
              type="button"
              onClick={() => setLightboxIndex(idx)}
              className="w-full cursor-pointer text-left"
            >
              <div className="grid grid-cols-2 gap-px bg-gray-100">
                <div className="relative aspect-square bg-gray-50">
                  {c.beforeImgUrl ? (
                    <Image src={c.beforeImgUrl} alt={`${c.title} 施術前`} fill className="object-cover" sizes="(min-width: 640px) 25vw, 50vw"  unoptimized={true} />
                  ) : (
                    <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-gray-300" /></div>
                  )}
                  <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs font-medium text-white">Before</span>
                </div>
                <div className="relative aspect-square bg-gray-50">
                  {c.afterImgUrl ? (
                    <Image src={c.afterImgUrl} alt={`${c.title} 施術後`} fill className="object-cover" sizes="(min-width: 640px) 25vw, 50vw"  unoptimized={true} />
                  ) : (
                    <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-gray-300" /></div>
                  )}
                  <span className="absolute bottom-2 left-2 rounded bg-[#c2185b]/80 px-2 py-0.5 text-xs font-medium text-white">After</span>
                </div>
              </div>
            </button>
            <div className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className="truncate text-sm font-medium text-gray-900 transition-colors hover:text-[#c2185b]"
                >
                  {c.title}
                </button>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-500">{c.categoryName}</span>
                  {c.techniqueName && (
                    <>
                      <span className="text-xs text-gray-300">/</span>
                      <span className="text-xs text-gray-500">{c.techniqueName}</span>
                    </>
                  )}
                </div>
              </div>
              <Link
                href={`/cases/${c.id}`}
                className="shrink-0 rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 transition-colors hover:border-[#c2185b] hover:text-[#c2185b]"
              >
                詳細
              </Link>
            </div>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={cases}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

interface SlotData {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  bookable: boolean;
}

function BookingTab({ artistId }: { artistId: string }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const m = `${year}-${String(month + 1).padStart(2, "0")}`;
    fetch(`/api/availability?artistId=${artistId}&month=${m}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setSlots(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [artistId, year, month]);

  function prevMonth() {
    setLoading(true);
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    setLoading(true);
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const isPastMonth =
    year < today.getFullYear() ||
    (year === today.getFullYear() && month <= today.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  const dateMap = new Map<string, { available: number; total: number }>();
  for (const s of slots) {
    const entry = dateMap.get(s.date) || { available: 0, total: 0 };
    entry.total++;
    if (s.bookable) entry.available++;
    dateMap.set(s.date, entry);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} disabled={isPastMonth} className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-30">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold">{year}年{month + 1}月</h3>
          <button onClick={nextMonth} className="rounded-lg p-2 hover:bg-gray-100">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#c2185b]" />
          </div>
        ) : (
          <div className="mt-4">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
              {weekDays.map((d) => (<div key={d} className="py-2">{d}</div>))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (<div key={`e-${i}`} />))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const entry = dateMap.get(dateStr);
                const isPast = new Date(dateStr) < new Date(today.toISOString().split("T")[0]);

                let marker: React.ReactNode = null;
                if (isPast) {
                  marker = <span className="text-[10px] text-gray-300">-</span>;
                } else if (!entry) {
                  marker = <span className="text-[10px] text-gray-300">-</span>;
                } else if (entry.available > 0) {
                  marker = <span className="text-[10px] font-bold text-green-500">○</span>;
                } else {
                  marker = <span className="text-[10px] font-bold text-red-400">×</span>;
                }

                return (
                  <div key={day} className="flex flex-col items-center rounded-lg py-1.5">
                    <span className={`text-sm ${isPast ? "text-gray-300" : "text-gray-700"}`}>{day}</span>
                    {marker}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="font-bold text-green-500">○</span> 空きあり</span>
          <span className="flex items-center gap-1"><span className="font-bold text-red-400">×</span> 予約済み</span>
          <span className="flex items-center gap-1"><span className="text-gray-300">-</span> 枠なし</span>
        </div>
      </div>

      <div className="text-center">
        <Link
          href={`/booking/${artistId}`}
          className="inline-block rounded-full bg-[#c2185b] px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#880e4f] hover:shadow-lg"
        >
          予約に進む
        </Link>
      </div>
    </div>
  );
}
