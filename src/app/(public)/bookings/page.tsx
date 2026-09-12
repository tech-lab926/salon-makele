"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Loader2, CalendarDays } from "lucide-react";

interface BookingItem {
  id: string;
  status: string;
  artist: { displayName: string; profileImgUrl: string | null };
  menu: { name: string; price: number | null } | null;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "申請中", className: "bg-amber-50 text-amber-700" },
  CONFIRMED: { label: "確定", className: "bg-green-50 text-green-700" },
  CANCELLED: { label: "キャンセル", className: "bg-red-50 text-red-600" },
  COMPLETED: { label: "完了", className: "bg-blue-50 text-blue-700" },
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MyBookingsPage() {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const limit = 25;

  const { data, error: swrError, isLoading, mutate } = useSWR(
    `/api/bookings?page=${page}&limit=${limit}`,
    fetcher,
    { keepPreviousData: true }
  );

  const bookings: BookingItem[] = data?.data || [];
  const pagination = data?.pagination || null;
  const loading = isLoading;
  const error = swrError || (data?.success === false ? data.error : "");

  async function cancelBooking(id: string) {
    if (!window.confirm("この予約をキャンセルしますか？")) return;

    setUpdatingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (data.success) {
        mutate();
      } else {
        window.alert(data.error || "予約のキャンセルに失敗しました");
      }
    } catch {
      window.alert("予約のキャンセルに失敗しました");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading && !bookings.length) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-gray-500">
          {error === "Authentication required"
            ? "予約一覧を表示するにはログインが必要です"
            : error}
        </p>
        <Link
          href="/login?redirect=/bookings"
          className="mt-4 inline-block rounded-lg bg-[#c2185b] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#880e4f]"
        >
          ログイン
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">予約一覧</h1>
      <p className="mt-1 text-sm text-gray-500">
        {pagination != null
          ? `全 ${pagination.total} 件`
          : "送信済みの予約リクエストを確認できます"}
      </p>

      {bookings.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <CalendarDays className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">まだ予約はありません</p>
          <Link
            href="/artists"
            className="mt-4 inline-block text-sm font-medium text-[#c2185b] hover:underline"
          >
            アーティストを探す
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-4">
            {bookings.map((booking) => {
            const statusInfo = statusLabels[booking.status] || statusLabels.PENDING;
            const canCancel =
              booking.status === "PENDING" || booking.status === "CONFIRMED";

            return (
              <div
                key={booking.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}
                    >
                      {statusInfo.label}
                    </span>
                    <p className="mt-3 text-lg font-semibold text-gray-900">
                      {booking.artist.displayName}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {booking.date} {booking.startTime}〜{booking.endTime}
                    </p>
                    {booking.menu && (
                      <p className="mt-1 text-sm text-gray-500">
                        メニュー: {booking.menu.name}
                        {booking.menu.price != null
                          ? ` / ¥${booking.menu.price.toLocaleString("ja-JP")}`
                          : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/artists"
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      他のアーティストを見る
                    </Link>
                    {canCancel && (
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        disabled={updatingId === booking.id}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {updatingId === booking.id ? "処理中..." : "予約をキャンセル"}
                      </button>
                    )}
                  </div>
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
              >
                前へ
              </button>
              <span className="text-sm text-gray-600">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() =>
                  setPage((p) => Math.min(pagination!.totalPages, p + 1))
                }
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
