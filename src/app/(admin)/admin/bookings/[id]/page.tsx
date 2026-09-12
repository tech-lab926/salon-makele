"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, Save } from "lucide-react";

interface BookingDetail {
  id: string;
  status: string;
  userNote: string | null;
  artistNote: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  stripePaymentIntentId: string | null;
  user: { id: string; name: string; email: string } | null;
  artist: { id: string; displayName: string } | null;
  menu: { id: string; name: string; price: number | null; durationMin: number } | null;
  date: string;
  startTime: string;
  endTime: string;
  fee: { id: string; status: string; feeAmount: number } | null;
  review: { id: string; rating: number; comment: string } | null;
}

const statusLabels: Record<string, { label: string; class: string }> = {
  PENDING: { label: "未対応", class: "bg-amber-50 text-amber-700" },
  CONFIRMED: { label: "確定", class: "bg-green-50 text-green-700" },
  CANCELLED: { label: "キャンセル", class: "bg-red-50 text-red-600" },
  COMPLETED: { label: "完了", class: "bg-blue-50 text-blue-700" },
};

export default function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [artistNote, setArtistNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/bookings/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setBooking(data.data);
          setArtistNote(data.data.artistNote || "");
        } else {
          setError(data.error || "予約の取得に失敗しました");
        }
      })
      .catch(() => setError("エラーが発生しました"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSaveNote() {
    setSavingNote(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistNote }),
      });
      const data = await res.json();
      if (data.success) {
        setBooking((prev) => prev ? { ...prev, artistNote } : prev);
        alert("メモを保存しました");
      } else {
        alert(data.error || "メモの保存に失敗しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        {error || "予約が見つかりません"}
      </div>
    );
  }

  const statusInfo = statusLabels[booking.status] || statusLabels.PENDING;

  return (
    <div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">予約詳細</h1>
        <span className={`ml-4 rounded-full px-3 py-1 text-sm font-medium ${statusInfo.class}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">基本情報</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">ID</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">{booking.id}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">日時</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {booking.date} {booking.startTime}〜{booking.endTime}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">メニュー</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {booking.menu?.name || "—"}
                  {booking.menu?.price != null && ` (¥${booking.menu.price.toLocaleString()})`}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">お客様</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {booking.user?.name} <br />
                  <span className="text-gray-500">{booking.user?.email}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">アーティスト</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {booking.artist?.displayName || "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">作成日時</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {new Date(booking.createdAt).toLocaleString("ja-JP")}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">更新日時</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {new Date(booking.updatedAt).toLocaleString("ja-JP")}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">支払い・決済情報</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">Stripe決済ID</div>
                <div className="col-span-2 text-sm font-medium text-gray-900 break-all">
                  {booking.stripePaymentIntentId || "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">システム手数料</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {booking.fee ? (
                    <>
                      ¥{booking.fee.feeAmount.toLocaleString()} 
                      <span className="ml-2 text-xs text-gray-500">({booking.fee.status})</span>
                    </>
                  ) : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">備考・メモ</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">お客様からの備考（任意）</label>
                <div className="mt-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  {booking.userNote || "記載なし"}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">管理者・アーティスト用メモ（非公開）</label>
                <textarea
                  value={artistNote}
                  onChange={(e) => setArtistNote(e.target.value)}
                  rows={4}
                  className="mt-2 block w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
                  placeholder="メモを自由に記入できます"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote || artistNote === booking.artistNote}
                    className="flex items-center gap-1.5 rounded-lg bg-[#c2185b] px-4 py-2 text-sm font-medium text-white hover:bg-[#880e4f] disabled:opacity-50"
                  >
                    {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>

          {(booking.cancelledBy || booking.status === "CANCELLED") && (
            <div className="rounded-xl border border-red-100 bg-red-50 shadow-sm overflow-hidden">
              <div className="bg-red-100 px-6 py-4 border-b border-red-200">
                <h2 className="font-semibold text-red-900">キャンセル情報</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-red-700">キャンセル者</div>
                  <div className="col-span-2 text-sm font-medium text-red-900">
                    {booking.cancelledBy === "user" ? "ユーザー" : booking.cancelledBy === "artist" ? "アーティスト" : booking.cancelledBy === "admin" ? "管理者" : "不明"}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-red-700">キャンセル日時</div>
                  <div className="col-span-2 text-sm font-medium text-red-900">
                    {booking.cancelledAt ? new Date(booking.cancelledAt).toLocaleString("ja-JP") : "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {booking.review && (
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">レビュー情報</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-gray-500">評価</div>
                  <div className="col-span-2 text-sm font-medium text-gray-900">
                    ★ {booking.review.rating}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-gray-500">コメント</div>
                  <div className="col-span-2 text-sm font-medium text-gray-900 whitespace-pre-wrap">
                    {booking.review.comment}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
