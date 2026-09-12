"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, X } from "lucide-react";

interface BookingItem {
  id: string;
  status: string;
  userNote: string | null;
  artistNote: string | null;
  user: { name: string; email: string };
  menu: { name: string; price: number | null; durationMin: number } | null;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

const statusLabels: Record<string, { label: string; class: string }> = {
  PENDING: { label: "未対応", class: "bg-amber-50 text-amber-700" },
  CONFIRMED: { label: "確定", class: "bg-green-50 text-green-700" },
  CANCELLED: { label: "キャンセル", class: "bg-red-50 text-red-600" },
  COMPLETED: { label: "完了", class: "bg-blue-50 text-blue-700" },
};

function ArtistNoteEditor({
  bookingId,
  initialNote,
  onSave,
}: {
  bookingId: string;
  initialNote: string | null;
  onSave: (note: string) => void;
}) {
  const [note, setNote] = useState(initialNote || "");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistNote: note }),
      });
      const data = await res.json();
      if (data.success) {
        onSave(note);
        setIsEditing(false);
      } else {
        alert(data.error || "メモの保存に失敗しました");
      }
    } catch {
      alert("通信エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500">アーティスト用メモ（非公開）</span>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-[#c2185b] hover:underline"
          >
            編集
          </button>
        </div>
        {initialNote ? (
          <p className="mt-1 whitespace-pre-wrap rounded-lg bg-pink-50 p-2 text-sm text-gray-700">
            {initialNote}
          </p>
        ) : (
          <p className="mt-1 text-xs text-gray-400">メモはありません</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <span className="text-xs font-semibold text-gray-500">アーティスト用メモ（非公開）</span>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
        placeholder="予約に関するメモを自由に記述できます"
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={() => {
            setNote(initialNote || "");
            setIsEditing(false);
          }}
          className="rounded-lg px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 rounded-lg bg-[#c2185b] px-3 py-1 text-xs font-medium text-white hover:bg-[#880e4f] disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
          保存
        </button>
      </div>
    </div>
  );
}


export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  } | null>(null);

  const limit = 25;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filter) params.set("status", filter);
    fetch(`/api/artist/bookings?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setBookings(data.data);
          setPagination(data.pagination ?? null);
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, filter]);

  async function updateStatus(
    bookingId: string,
    nextStatus: "CONFIRMED" | "CANCELLED" | "COMPLETED",
  ) {
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await res.json();
    if (data.success) {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b)),
      );
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">予約管理</h1>
      <p className="mt-1 text-sm text-gray-500">
        {pagination != null ? `全 ${pagination.total} 件` : null}
      </p>

      {/* Status Filter */}
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { value: "", label: "すべて" },
          { value: "PENDING", label: "未対応" },
          { value: "CONFIRMED", label: "確定" },
          { value: "COMPLETED", label: "完了" },
          { value: "CANCELLED", label: "キャンセル" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setLoading(true);
              setFilter(opt.value);
              setPage(1);
            }}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === opt.value
                ? "border-[#c2185b] bg-pink-50 text-[#c2185b]"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-500">予約がありません</p>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-4">
            {bookings.map((booking) => {
            const statusInfo =
              statusLabels[booking.status] || statusLabels.PENDING;

            return (
              <div
                key={booking.id}
                className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.class}`}
                      >
                        {statusInfo.label}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {booking.date} {booking.startTime}〜{booking.endTime}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700">
                      <span className="text-gray-500">お客様：</span>
                      {booking.user.name}（{booking.user.email}）
                    </p>
                    {booking.menu && (
                      <p className="mt-1 text-sm text-gray-700">
                        <span className="text-gray-500">メニュー：</span>
                        {booking.menu.name}
                        {booking.menu.price != null &&
                          ` ¥${booking.menu.price.toLocaleString()}`}
                      </p>
                    )}
                    {booking.userNote && (
                      <p className="mt-2 rounded-lg bg-gray-50 p-2 text-sm text-gray-600">
                        {booking.userNote}
                      </p>
                    )}

                    <ArtistNoteEditor
                      bookingId={booking.id}
                      initialNote={booking.artistNote}
                      onSave={(note) => {
                        setBookings((prev) =>
                          prev.map((b) =>
                            b.id === booking.id ? { ...b, artistNote: note } : b
                          )
                        );
                      }}
                    />
                  </div>

                  {booking.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          updateStatus(booking.id, "CONFIRMED")
                        }
                        className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                        承認
                      </button>
                      <button
                        onClick={() =>
                          updateStatus(booking.id, "CANCELLED")
                        }
                        className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                      >
                        <X className="h-3.5 w-3.5" />
                        拒否
                      </button>
                    </div>
                  )}

                  {booking.status === "CONFIRMED" && (
                    <button
                      onClick={() => {
                        if (window.confirm("本当に施術を完了にしますか？\n（※施術がすべて終わった後でのみ実行してください）")) {
                          updateStatus(booking.id, "COMPLETED");
                        }
                      }}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                    >
                      施術完了にする
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
          {pagination != null && pagination.totalPages > 1 ? (
            <nav
              className="mt-8 flex flex-wrap items-center justify-center gap-4"
              aria-label="ページ送り"
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => Math.max(1, p - 1));
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
              >
                前へ
              </button>
              <span className="text-sm text-gray-600">
                {page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => {
                  setLoading(true);
                  setPage((p) => Math.min(pagination!.totalPages, p + 1));
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
              >
                次へ
              </button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
