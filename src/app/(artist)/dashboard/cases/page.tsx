"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus, Trash2, Eye, EyeOff, Loader2, Pencil } from "lucide-react";

interface CaseItem {
  id: string;
  title: string;
  categoryName: string;
  techniqueName: string | null;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CasesPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, error, isLoading, mutate } = useSWR(
    `/api/artist/cases?page=${page}&limit=${limit}`,
    fetcher,
    { keepPreviousData: true }
  );

  const cases: CaseItem[] = data?.data || [];
  const pagination = data?.pagination || null;
  const loading = isLoading;

  async function handleDelete(id: string) {
    if (!confirm("この症例を削除しますか？")) return;
    const res = await fetch(`/api/artist/cases/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      mutate();
    }
  }

  if (loading && !cases.length) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center text-red-500">
        データの読み込みに失敗しました。
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">症例管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pagination != null ? `全 ${pagination.total} 件` : `${cases.length}件の症例`}
          </p>
        </div>
        <Link
          href="/dashboard/cases/new"
          className="flex items-center gap-2 rounded-lg bg-[#c2185b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#880e4f]"
        >
          <Plus className="h-4 w-4" />
          新規追加
        </Link>
      </div>

      {cases.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-gray-500">症例がまだありません</p>
          <Link
            href="/dashboard/cases/new"
            className="mt-4 inline-block text-sm font-medium text-[#c2185b] hover:underline"
          >
            最初の症例を追加する →
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  タイトル
                </th>
                <th className="hidden px-4 py-3 text-left font-medium text-gray-500 sm:table-cell">
                  カテゴリ
                </th>
                <th className="hidden px-4 py-3 text-center font-medium text-gray-500 md:table-cell">
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
                    <p className="mt-0.5 text-xs text-gray-400 sm:hidden">
                      {c.categoryName}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                    {c.categoryName}
                    {c.techniqueName && (
                      <span className="text-gray-400">
                        {" "}
                        / {c.techniqueName}
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-center md:table-cell">
                    {c.isPublished ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        <Eye className="h-3 w-3" /> 公開中
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                        <EyeOff className="h-3 w-3" /> 非公開
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/cases/${c.id}/edit`}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                        title="編集"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
          >
            次へ
          </button>
        </nav>
      ) : null}
    </div>
  );
}
