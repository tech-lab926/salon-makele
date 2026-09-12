"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { ADMIN_ITEMS_PER_PAGE } from "@/constants";
import Link from "next/link";

interface AdminBooking {
  id: string;
  status: string;
  user: { name: string; email: string };
  artist: string;
  menu: { name: string; price: number | null } | null;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const statusLabels: Record<string, { label: string; class: string }> = {
  PENDING: { label: "未対応", class: "bg-amber-50 text-amber-700" },
  CONFIRMED: { label: "確定", class: "bg-green-50 text-green-700" },
  CANCELLED: { label: "キャンセル", class: "bg-red-50 text-red-600" },
  COMPLETED: { label: "完了", class: "bg-blue-50 text-blue-700" },
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: ADMIN_ITEMS_PER_PAGE,
    totalPages: 1,
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [prevPage, setPrevPage] = useState(page);

  if (page !== prevPage) {
    setPrevPage(page);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(ADMIN_ITEMS_PER_PAGE),
    });

    fetch(`/api/admin/bookings?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setBookings(data.data);
          if (data.pagination) setPagination(data.pagination);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [page]);

  async function updateStatus(id: string, status: "CONFIRMED" | "CANCELLED" | "COMPLETED") {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings((prev) =>
          prev.map((booking) => (booking.id === id ? { ...booking, status } : booking)),
        );
      } else if (data.error) {
        window.alert(data.error);
      }
    } catch {
      window.alert("予約ステータスの更新に失敗しました");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading && bookings.length === 0) {
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
        {pagination.total}件（ページ {pagination.page} / {pagination.totalPages || 1}）
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">
                日時
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-gray-500 sm:table-cell">
                お客様
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-gray-500 md:table-cell">
                アーティスト
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-gray-500 lg:table-cell">
                メニュー
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">
                ステータス
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bookings.map((b) => {
              const statusInfo =
                statusLabels[b.status] || statusLabels.PENDING;
              return (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.date}</p>
                    <p className="text-xs text-gray-400">
                      {b.startTime}〜{b.endTime}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <p className="text-gray-900">{b.user.name}</p>
                    <p className="text-xs text-gray-400">{b.user.email}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                    {b.artist}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                    {b.menu?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.class}`}
                    >
                      {statusInfo.label}
                    </span>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      {b.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => updateStatus(b.id, "CONFIRMED")}
                            disabled={updatingId === b.id}
                            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            確定
                          </button>
                          <button
                            onClick={() => updateStatus(b.id, "CANCELLED")}
                            disabled={updatingId === b.id}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            キャンセル
                          </button>
                        </>
                      )}
                      {b.status === "CONFIRMED" && (
                        <>
                          <button
                            onClick={() => updateStatus(b.id, "COMPLETED")}
                            disabled={updatingId === b.id}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            完了
                          </button>
                          <button
                            onClick={() => updateStatus(b.id, "CANCELLED")}
                            disabled={updatingId === b.id}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            キャンセル
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="inline-flex rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> 前へ
          </button>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 disabled:opacity-40"
          >
            次へ <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
