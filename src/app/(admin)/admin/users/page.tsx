"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, ShieldCheck, Palette, User, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { ADMIN_ITEMS_PER_PAGE } from "@/constants";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  bookingCount: number | string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const roleBadge: Record<string, { label: string; className: string; icon: typeof User }> = {
  ADMIN: { label: "管理者", className: "bg-purple-50 text-purple-700", icon: ShieldCheck },
  ARTIST: { label: "アーティスト", className: "bg-pink-50 text-[#c2185b]", icon: Palette },
  USER: { label: "一般ユーザー", className: "bg-gray-100 text-gray-600", icon: User },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: ADMIN_ITEMS_PER_PAGE,
    totalPages: 1,
  });
  const [filter, setFilter] = useState("ALL");

  const [prevDeps, setPrevDeps] = useState({ page, filter });

  if (page !== prevDeps.page || filter !== prevDeps.filter) {
    setPrevDeps({ page, filter });
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    // Removed setLoading(true) from here
    const params = new URLSearchParams({
      page: String(page),
      limit: String(ADMIN_ITEMS_PER_PAGE),
    });
    if (filter !== "ALL") params.set("role", filter);

    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setUsers(data.data);
          if (data.pagination) setPagination(data.pagination);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, filter]);

  function changeFilter(next: string) {
    setFilter(next);
    setPage(1);
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
        <p className="mt-1 text-sm text-gray-500">
          {pagination.total}人（ページ {pagination.page} / {pagination.totalPages || 1}）
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {["ALL", "USER", "ARTIST", "ADMIN"].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => changeFilter(r)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === r
                ? "bg-[#c2185b] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {r === "ALL" ? "全員" : roleBadge[r]?.label || r}
          </button>
        ))}
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
                <th className="px-4 py-3 text-left font-medium text-gray-500">名前</th>
                <th className="hidden px-4 py-3 text-left font-medium text-gray-500 sm:table-cell">メール</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">ロール</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 md:table-cell">認証</th>
                <th className="hidden px-4 py-3 text-center font-medium text-gray-500 md:table-cell">予約数</th>
                <th className="hidden px-4 py-3 text-right font-medium text-gray-500 lg:table-cell">登録日</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => {
                const badge = roleBadge[u.role] || roleBadge.USER;
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-center md:table-cell">
                      {u.emailVerified ? (
                        <span className="text-green-600">済</span>
                      ) : (
                        <span className="text-gray-400">未</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-center text-gray-600 md:table-cell">
                      {u.bookingCount}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-gray-400 lg:table-cell">
                      {new Date(u.createdAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-[#fce4ec] hover:text-[#c2185b] transition-colors"
                        title="詳細"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
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
