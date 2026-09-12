"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Pencil, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { ADMIN_ITEMS_PER_PAGE } from "@/constants";

interface AdminArtist {
  id: string;
  displayName: string;
  email: string;
  area: string;
  isPublished: boolean;
  registrationStatus: string;
  caseCount: number;
  bookingCount: number;
  skills: string[];
  skillCount?: number;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminArtistsPage() {
  const [artists, setArtists] = useState<AdminArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: ADMIN_ITEMS_PER_PAGE,
    totalPages: 1,
  });

  const [prevPage, setPrevPage] = useState(page);

  if (page !== prevPage) {
    setPrevPage(page);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    // Removed setLoading(true) from here to avoid cascading render warning
    const params = new URLSearchParams({
      page: String(page),
      limit: String(ADMIN_ITEMS_PER_PAGE),
    });
    fetch(`/api/admin/artists?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setArtists(data.data);
          if (data.pagination) setPagination(data.pagination);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  async function togglePublish(id: string, isPublished: boolean) {
    await fetch("/api/admin/artists", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPublished: !isPublished }),
    });
    setArtists((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, isPublished: !isPublished } : a,
      ),
    );
  }

  if (loading && artists.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">アーティスト管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pagination.total}件（ページ {pagination.page} / {pagination.totalPages || 1}）
          </p>
        </div>
        <Link
          href="/admin/artists/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#c2185b] px-4 py-2 text-sm font-medium text-white hover:bg-[#880e4f]"
        >
          <Plus className="h-4 w-4" />
          アーティスト登録
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#c2185b]" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  名前
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-gray-500 sm:table-cell">
                  エリア
                </th>
                <th className="hidden px-4 py-3 text-center font-medium text-gray-500 md:table-cell">
                  症例
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">
                  審査状態
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
              {artists.map((artist) => (
                <tr key={artist.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {artist.displayName}
                    </p>
                    <p className="text-xs text-gray-400">{artist.email}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                    {artist.area}
                  </td>
                  <td className="hidden px-4 py-3 text-center text-gray-600 md:table-cell">
                    {artist.caseCount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {artist.registrationStatus === "PROVISIONAL" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                        仮登録
                      </span>
                    )}
                    {artist.registrationStatus === "APPROVED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        承認済
                      </span>
                    )}
                    {artist.registrationStatus === "REJECTED" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        却下
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {artist.isPublished ? (
                      <span key="pub" className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        <Eye className="h-3 w-3" /> <span>公開</span>
                      </span>
                    ) : (
                      <span key="unpub" className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                        <EyeOff className="h-3 w-3" /> <span>非公開</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/artists/${artist.id}`}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#fce4ec] hover:text-[#c2185b]"
                        title="詳細"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/artists/${artist.id}/edit`}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                        title="編集"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        key={artist.isPublished ? "btn-pub" : "btn-unpub"}
                        onClick={() =>
                          togglePublish(artist.id, artist.isPublished)
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                          artist.isPublished
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-[#c2185b] text-white hover:bg-[#880e4f]"
                        }`}
                      >
                        {artist.isPublished ? "非公開にする" : "公開する"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
