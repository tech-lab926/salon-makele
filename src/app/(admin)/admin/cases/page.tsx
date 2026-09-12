"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import toast from "react-hot-toast";
import { ADMIN_ITEMS_PER_PAGE } from "@/constants";

interface AdminCase {
  id: string;
  title: string;
  artistName: string;
  categoryName: string;
  techniqueName: string | null;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminCasesPage() {
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: ADMIN_ITEMS_PER_PAGE,
    totalPages: 1,
  });
  const [filter, setFilter] = useState<"all" | "published" | "unpublished">(
    "all",
  );

  const [prevDeps, setPrevDeps] = useState({ page, filter });

  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    if (filter === "published") params.set("published", "true");
    if (filter === "unpublished") params.set("published", "false");

    fetch(`/api/admin/cases?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setCases(data.data);
          if (data.pagination) setPagination(data.pagination);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, filter]);

  function changeFilter(next: typeof filter) {
    setFilter(next);
    setPage(1);
  }

  async function handleDelete() {
    if (!deleteId) return;
    const res = await fetch(`/api/admin/cases/${deleteId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setCases((prev) => prev.filter((c) => c.id !== deleteId));
      setPagination((p) => ({ ...p, total: Math.max(0, p.total - 1) }));
      toast.success("削除しました");
    } else {
      toast.error(data.error || "削除に失敗しました");
    }
    setDeleteId(null);
  }

  async function togglePublish(id: string, isPublished: boolean) {
    await fetch("/api/admin/cases", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPublished: !isPublished }),
    });
    setCases((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isPublished: !isPublished } : c,
      ),
    );
  }

  if (loading && cases.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">症例管理</h1>
      <p className="mt-1 text-sm text-gray-500">
        {pagination.total}件の症例（ページ {pagination.page} / {pagination.totalPages || 1}）
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            { v: "all" as const, l: "すべて" },
            { v: "unpublished" as const, l: "未承認" },
            { v: "published" as const, l: "公開中" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.v}
            type="button"
            onClick={() => changeFilter(opt.v)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === opt.v
                ? "border-[#c2185b] bg-pink-50 text-[#c2185b]"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {opt.l}
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
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  タイトル
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-gray-500 sm:table-cell">
                  アーティスト
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-gray-500 md:table-cell">
                  カテゴリ
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
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.title}</p>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                    {c.artistName}
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                    {c.categoryName}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.isPublished ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        <Eye className="h-3 w-3" /> 公開
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                        <EyeOff className="h-3 w-3" /> 未承認
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/cases/${c.id}`}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-emerald-50 hover:text-emerald-500"
                        title="詳細"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/cases/${c.id}/edit`}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                        title="編集"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteId(c.id)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePublish(c.id, c.isPublished)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                          c.isPublished
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {c.isPublished ? "非公開" : "承認する"}
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

      <ConfirmModal
        isOpen={!!deleteId}
        title="症例の削除"
        message="この症例を削除します。この操作は取り消せません。よろしいですか？"
        confirmText="削除する"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isDestructive={true}
      />
    </div>
  );
}
