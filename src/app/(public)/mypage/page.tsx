"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  CalendarDays, 
  Bell, 
  ChevronRight, 
  User as UserIcon, 
  History, 
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Heart,
  Star,
  Ticket,
  X
} from "lucide-react";
import useSWR from "swr";
import PhotoGrid, { GridCase } from "@/components/ui/PhotoGrid";
import { isMockUiEnabledClient } from "@/lib/runtime-flags";

interface Booking {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  artistId: string;
  menuId: string | null;
  artist: { displayName: string; profileImgUrl: string | null; lineUrl?: string | null };
  menu: { name: string; price: number | null } | null;
  date: string;
  startTime: string;
  endTime: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface PointHistory {
  id: number;
  action: string;
  points: number;
  date: string;
}

interface Coupon {
  id: number;
  title: string;
  expire: string;
  status: string;
}

interface MypageSummary {
  favorites: GridCase[];
  points: { balance: number; history: PointHistory[] };
  coupons: Coupon[];
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  PENDING: { label: "申請中", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  CONFIRMED: { label: "確定", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  CANCELLED: { label: "キャンセル", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  COMPLETED: { label: "完了", icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50" },
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Auth fetcher unwraps the { success, data } response to match Header.tsx
const authFetcher = (url: string) => 
  fetch(url).then((res) => res.json()).then((data) => data.success ? data.data : null);

export default function MyPage() {
  const useMockUi = isMockUiEnabledClient();
  const { data: userFromSwr, error: userError } = useSWR("/api/auth/me", authFetcher);
  const { data: bookingsData, mutate: mutateBookings } = useSWR("/api/bookings?limit=8&page=1", fetcher);
  const { data: notificationsData, mutate: mutateNotifications } = useSWR("/api/notifications", fetcher);
  const { data: mypageSummaryData } = useSWR("/api/mypage/summary", fetcher);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"bookings" | "favorites" | "points" | "coupons">("bookings");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [cancelPromptBooking, setCancelPromptBooking] = useState<Booking | null>(null);

  // Force-recognize the demo user if we are in the demo environment
  const demoFallback = useMockUi && typeof window !== "undefined" && document.cookie.includes("demo_role=user")
    ? { name: "テスト一般ユーザー", id: "3" } 
    : null;
    
  const user = userFromSwr ?? demoFallback;
  const isAuthLoading = userFromSwr === undefined && !userError && !demoFallback;
  const isLoading = isAuthLoading || (!bookingsData && !notificationsData && !mypageSummaryData && !userError);
  
  const bookings = (bookingsData?.data || []).slice(0, 3) as Booking[];
  const notifications = (notificationsData?.data || []).slice(0, 5) as Notification[];

  const mypageSummary = (mypageSummaryData?.data || {
    favorites: [],
    points: { balance: 0, history: [] },
    coupons: [],
  }) as MypageSummary;

  const handleCancelClick = (booking: Booking) => {
    setCancelPromptBooking(booking);
  };

  const executeCancel = async (id: string) => {
    setActionLoading(id);
    setCancelPromptBooking(null);
    try {
      const res = await fetch(`/api/bookings/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await mutateBookings();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReadAllNotifications = async () => {
    setActionLoading("notifications");
    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (res.ok) {
        await mutateNotifications();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  // /api/auth/me returns success=true with data=null for guests; handle that as unauthenticated.
  if (!isAuthLoading && !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900">ログインが必要です</h2>
        <p className="mt-2 text-gray-500">マイページを表示するにはログインしてください。</p>
        <Link 
          href="/login" 
          className="mt-6 inline-block rounded-full bg-[#c2185b] px-8 py-3 font-semibold text-white transition-all hover:bg-[#880e4f] hover:shadow-lg"
        >
          ログインする
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-20 pt-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header / Welcome */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pink-100 to-rose-50 p-0.5 shadow-sm">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-[#c2185b]">
                {user.image ? (
                  <img src={user.image} alt={user.name} referrerPolicy="no-referrer" className="h-full w-full object-cover rounded-full" />
                ) : (
                  <UserIcon className="h-8 w-8" />
                )}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                こんにちは、{user.name}さん
              </h1>
              <p className="text-sm text-gray-500">今日もあなたにぴったりの美しさを見つけましょう</p>
            </div>
          </div>
          <Link 
            href="/search"
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm border border-gray-100 transition-all hover:border-[#c2185b] hover:text-[#c2185b]"
          >
            <Search className="h-4 w-4" />
            アーティストを探す
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar [touch-action:pan-x_pan-y]">
              <button 
                onClick={() => setActiveTab("bookings")}
                className={`whitespace-nowrap py-3 px-4 font-bold text-sm ${activeTab === "bookings" ? "border-b-2 border-[#c2185b] text-[#c2185b]" : "text-gray-500 hover:text-gray-700"}`}
              >
                予約履歴
              </button>
              <button 
                onClick={() => setActiveTab("favorites")}
                className={`whitespace-nowrap py-3 px-4 font-bold text-sm ${activeTab === "favorites" ? "border-b-2 border-[#c2185b] text-[#c2185b]" : "text-gray-500 hover:text-gray-700"}`}
              >
                お気に入り
              </button>
              <button 
                onClick={() => setActiveTab("points")}
                className={`whitespace-nowrap py-3 px-4 font-bold text-sm ${activeTab === "points" ? "border-b-2 border-[#c2185b] text-[#c2185b]" : "text-gray-500 hover:text-gray-700"}`}
              >
                ポイント
              </button>
              <button 
                onClick={() => setActiveTab("coupons")}
                className={`whitespace-nowrap py-3 px-4 font-bold text-sm ${activeTab === "coupons" ? "border-b-2 border-[#c2185b] text-[#c2185b]" : "text-gray-500 hover:text-gray-700"}`}
              >
                クーポン
              </button>
            </div>

            {/* Tab Contents */}
            <div className="min-h-[400px]">
              
              {activeTab === "bookings" && (
                <section className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                      <CalendarDays className="h-5 w-5 text-[#c2185b]" />
                      直近の予約
                    </h2>
                    <Link href="/bookings" className="text-xs font-medium text-[#c2185b] hover:underline flex items-center">
                      すべて見る <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                  
                  <div className="space-y-4">
                    {bookings.length > 0 ? (
                      bookings.map((booking: any) => {
                        const config = statusConfig[booking.status] || statusConfig.PENDING;
                        const StatusIcon = config.icon;
                        return (
                          <div 
                            key={booking.id}
                            className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                          >
                            <div className="flex gap-4">
                              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                                {booking.artist.profileImgUrl ? (
                                  <Image 
                                    src={booking.artist.profileImgUrl} 
                                    alt={booking.artist.displayName} 
                                    fill 
                                    className="object-cover"
                                   unoptimized={true} />
                                ) : (
                                  <div className="flex h-full items-center justify-center bg-pink-50 text-[#c2185b]">
                                    <UserIcon className="h-6 w-6" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <h3 className="truncate font-bold text-gray-900 group-hover:text-[#c2185b]">
                                    {booking.artist.displayName}
                                  </h3>
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.color}`}>
                                    <StatusIcon className="h-3 w-3" />
                                    {config.label}
                                  </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-600 font-medium">
                                  {booking.date.replace(/-/g, '/')} {booking.startTime}〜{booking.endTime}
                                </p>
                                <div className="mt-3 flex flex-col gap-2">
                                  {(booking.status === "PENDING" || booking.status === "CONFIRMED") && booking.artist.lineUrl && (
                                    <a 
                                      href={booking.artist.lineUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs font-medium text-[#06C755] hover:underline"
                                    >
                                      遅刻・緊急のご連絡はこちら(LINE)
                                    </a>
                                  )}
                                  <div className="flex items-center gap-3">
                                    {(() => {
                                      const bookingDateTime = new Date(`${booking.date}T${booking.startTime}:00+09:00`);
                                      const now = new Date();
                                      const hoursDiff = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                                      const canReschedule = hoursDiff > 12;
                                      
                                      return (booking.status === "PENDING" || booking.status === "CONFIRMED") && canReschedule && (
                                        <Link
                                          href={`/booking/${booking.artistId}?rescheduleBookingId=${booking.id}&menuId=${booking.menuId || ""}`}
                                          className="text-xs font-semibold text-blue-500 hover:text-blue-700"
                                        >
                                          予約を変更
                                        </Link>
                                      );
                                    })()}
                                    {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                                      <button
                                        onClick={() => handleCancelClick(booking)}
                                        disabled={!!actionLoading}
                                        className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50"
                                      >
                                        {actionLoading === booking.id ? "キャンセル中..." : "予約をキャンセル"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
                        <CalendarDays className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-2 text-sm text-gray-500">予定されている予約はありません</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {activeTab === "favorites" && (
                <section className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="mb-4 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-[#c2185b] fill-[#c2185b]" />
                    <h2 className="text-lg font-bold text-gray-900">お気に入り症例</h2>
                  </div>
                  {mypageSummary.favorites.length > 0 ? (
                    <PhotoGrid cases={mypageSummary.favorites} />
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-10 text-center text-sm text-gray-500">
                      お気に入りはまだありません
                    </div>
                  )}
                </section>
              )}

              {activeTab === "points" && (
                <section className="animate-in fade-in slide-in-from-bottom-2">
                  {useMockUi || mypageSummary.points.history.length > 0 || mypageSummary.points.balance > 0 ? (
                    <>
                      <div className="mb-6 rounded-3xl bg-gradient-to-br from-pink-500 to-rose-600 p-6 text-white shadow-md">
                        <div className="flex items-center gap-2 text-pink-100">
                          <Star className="h-5 w-5 fill-current" />
                          <span className="font-bold">現在のポイント</span>
                        </div>
                        <div className="mt-2 text-4xl font-extrabold flex items-end gap-1">
                          {mypageSummary.points.balance.toLocaleString()} <span className="text-lg font-medium text-pink-100 mb-1">pt</span>
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 mb-4">ポイント履歴</h3>
                      <div className="space-y-3">
                        {mypageSummary.points.history.map((pt: any) => (
                          <div key={pt.id} className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                            <div>
                              <div className="font-bold text-sm text-gray-900">{pt.action}</div>
                              <div className="text-xs text-gray-500 mt-1">{pt.date}</div>
                            </div>
                            <div className="font-bold text-[#c2185b]">+{pt.points} pt</div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-10 text-center text-sm text-gray-500">
                      ポイント機能は準備中です
                    </div>
                  )}
                </section>
              )}

              {activeTab === "coupons" && (
                <section className="animate-in fade-in slide-in-from-bottom-2">
                  <div className="mb-4 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-[#c2185b]" />
                    <h2 className="text-lg font-bold text-gray-900">保有クーポン</h2>
                  </div>
                  {mypageSummary.coupons.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mypageSummary.coupons.map((coupon: any) => (
                        <div key={coupon.id} className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-pink-100 flex">
                          <div className="w-16 bg-gradient-to-b from-[#c2185b] to-rose-500 flex items-center justify-center border-r border-dashed border-white">
                             <span className="-rotate-90 text-white font-bold tracking-widest text-sm whitespace-nowrap">COUPON</span>
                          </div>
                          <div className="p-4 flex-1">
                            <h4 className="font-bold text-gray-900">{coupon.title}</h4>
                            <p className="text-xs text-gray-500 mt-2">有効期限: {coupon.expire}</p>
                            <div className="mt-3 inline-block rounded-full bg-pink-50 px-3 py-1 text-xs font-bold text-[#c2185b]">
                              {coupon.status}
                            </div>
                          </div>
                          {/* Decorative cuts for coupon ticket feel */}
                          <div className="absolute left-[3.5rem] -top-2 w-4 h-4 rounded-full bg-[#fafafa]"></div>
                          <div className="absolute left-[3.5rem] -bottom-2 w-4 h-4 rounded-full bg-[#fafafa]"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-10 text-center text-sm text-gray-500">
                      クーポン機能は準備中です
                    </div>
                  )}
                </section>
              )}

            </div>

            {/* Quick Actions / Categories */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-gray-900">クイックメニュー</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: "履歴", icon: History, href: "/history", color: "bg-blue-50 text-blue-600" },
                  { label: "お気に入り", icon: UserIcon, href: "#", color: "bg-rose-50 text-rose-600" },
                  { label: "予約する", icon: Search, href: "/search", color: "bg-purple-50 text-purple-600" },
                  { label: "ブログ", icon: Bell, href: "/blog", color: "bg-amber-50 text-amber-600" },
                ].map((item: any) => (
                  <Link 
                    key={item.label}
                    href={item.href}
                    className="flex flex-col items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-gray-50 transition-all hover:border-[#c2185b]/20 hover:shadow-md"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.color}`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">{item.label}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Notifications */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                  <Bell className="h-5 w-5 text-[#c2185b]" />
                  お知らせ
                </h2>
              </div>
              <div className="rounded-3xl border border-gray-100 bg-white p-2 shadow-sm">
                <div className="divide-y divide-gray-50">
                  {notifications.length > 0 ? (
                    notifications.map((n: any) => (
                      <button 
                        key={n.id} 
                        onClick={() => {
                          setSelectedNotification(n);
                          if (!n.isRead) {
                            // Optimistically mark as read in UI, actual mark as read might need an API call,
                            // but for now we just show the modal.
                          }
                        }}
                        className={`w-full text-left p-4 transition-colors hover:bg-gray-50 ${!n.isRead ? 'bg-pink-50/30' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                          {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-[#c2185b]" />}
                        </div>
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {n.body}
                        </p>
                        <time className="mt-2 block text-[10px] text-gray-400">
                          {new Date(n.createdAt).toLocaleDateString('ja-JP', { timeZone: "Asia/Tokyo" })}
                        </time>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-gray-400">
                      新しい通知はありません
                    </div>
                  )}
                </div>
                {notifications.some(n => !n.isRead) && (
                  <button 
                    onClick={handleReadAllNotifications}
                    disabled={actionLoading === "notifications"}
                    className="w-full border-t border-gray-50 py-3 text-center text-xs font-bold text-gray-400 hover:text-[#c2185b] disabled:opacity-30"
                  >
                    {actionLoading === "notifications" ? "更新中..." : "すべての通知を既読にする"}
                  </button>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {cancelPromptBooking && (() => {
        const bookingDateStr = `${cancelPromptBooking.date.replace(/\//g, '-')}T${cancelPromptBooking.startTime}:00+09:00`;
        const bookingDate = new Date(bookingDateStr);
        const now = new Date();
        const diffHours = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const isWithin24Hours = diffHours < 24;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setCancelPromptBooking(null)}>
            <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <button onClick={() => setCancelPromptBooking(null)} className="absolute right-6 top-6 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50">
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="pr-8 text-xl font-extrabold text-gray-900">
                    {isWithin24Hours ? "キャンセルポリシーの確認" : "予約のキャンセル"}
                  </h3>
                </div>
              </div>
              <div className="mt-2 text-base leading-relaxed text-gray-700 whitespace-pre-wrap rounded-2xl bg-gray-50 p-6 border border-gray-100">
                {isWithin24Hours ? (
                  <>
                    <p className="font-semibold text-red-600 mb-2">ご予約の24時間前を過ぎています。</p>
                    <p>キャンセルポリシーに基づき、キャンセル料が発生する場合があります。</p>
                    <p className="mt-4">本当にキャンセルしてよろしいですか？</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-900 mb-2">この予約をキャンセルしてもよろしいですか？</p>
                    <p>キャンセル後は元に戻すことができません。</p>
                  </>
                )}
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
                <button onClick={() => setCancelPromptBooking(null)} className="w-full sm:w-auto rounded-full bg-gray-100 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-all">
                  戻る
                </button>
                <button onClick={() => executeCancel(cancelPromptBooking.id)} className="w-full sm:w-auto rounded-full bg-red-500 px-6 py-3 text-sm font-bold text-white hover:bg-red-600 shadow-sm transition-all flex items-center justify-center">
                  {actionLoading === cancelPromptBooking.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isWithin24Hours ? "承諾してキャンセルする" : "キャンセルする"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedNotification(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl relative animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedNotification(null)} className="absolute right-6 top-6 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-50">
                <Bell className="h-6 w-6 text-[#c2185b]" />
              </div>
              <div>
                <h3 className="pr-8 text-xl font-extrabold text-gray-900">{selectedNotification.title}</h3>
                <time className="mt-1 block text-sm font-medium text-gray-500">
                  {new Date(selectedNotification.createdAt).toLocaleString('ja-JP', { timeZone: "Asia/Tokyo" })}
                </time>
              </div>
            </div>
            <div className="mt-2 text-base leading-relaxed text-gray-700 whitespace-pre-wrap rounded-2xl bg-gray-50 p-6 border border-gray-100">
              {selectedNotification.body}
            </div>
            <div className="mt-8 text-center">
              <button onClick={() => setSelectedNotification(null)} className="w-full sm:w-auto rounded-full bg-[#c2185b] px-10 py-3 text-sm font-bold text-white hover:bg-[#880e4f] shadow-sm hover:shadow-md transition-all">
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
