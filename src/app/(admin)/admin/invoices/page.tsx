"use client";

import { useState, useEffect } from "react";
import { Loader2, Download, FileText, Plus, ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import { ADMIN_ITEMS_PER_PAGE } from "@/constants";

interface AdminInvoice {
  id: string;
  artistId: string;
  artistName: string;
  periodStart: string;
  periodEnd: string;
  listingFee: number;
  totalBookingFees: number;
  totalAmount: number;
  status: string;
  issuedAt: string | null;
  paidAt: string | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const statusLabels: Record<string, { label: string; class: string }> = {
  DRAFT: { label: "下書き", class: "bg-gray-100 text-gray-700" },
  SENT: { label: "送付済", class: "bg-blue-50 text-blue-700" },
  PAID: { label: "支払い済", class: "bg-green-50 text-green-700" },
  OVERDUE: { label: "期限切れ", class: "bg-red-50 text-red-600" },
};

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: ADMIN_ITEMS_PER_PAGE,
    totalPages: 1,
  });

  const [generating, setGenerating] = useState(false);
  const [genArtistId, setGenArtistId] = useState("");
  const [genYear, setGenYear] = useState(new Date().getFullYear().toString());
  const [genMonth, setGenMonth] = useState(new Date().getMonth().toString() || "1");

  useEffect(() => {
    fetchInvoices();
  }, [page]);

  async function fetchInvoices() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ADMIN_ITEMS_PER_PAGE),
      });
      const res = await fetch(`/api/admin/invoices?${params}`);
      const data = await res.json();
      if (data.success) {
        setInvoices(data.data);
        if (data.pagination) setPagination(data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!genArtistId || !genYear || !genMonth) {
      alert("すべての項目を入力してください");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: genArtistId,
          year: genYear,
          month: genMonth,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("請求書を生成しました");
        fetchInvoices();
      } else {
        alert(data.error || "生成に失敗しました");
      }
    } catch (e) {
      alert("エラーが発生しました");
    } finally {
      setGenerating(false);
    }
  }

  function downloadCsv() {
    window.location.href = "/api/admin/invoices/export";
  }

  if (loading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">請求・入金管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            アーティストへの月次請求の管理とダウンロード
          </p>
        </div>
        <button
          onClick={downloadCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <FileSpreadsheet className="h-4 w-4" />
          CSVエクスポート
        </button>
      </div>

      {/* Generation Form */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-gray-900">
          <Plus className="h-4 w-4 text-[#c2185b]" />
          請求書の新規作成（手動）
        </h3>
        <div className="mt-4 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">アーティストID</label>
            <input
              type="text"
              value={genArtistId}
              onChange={(e) => setGenArtistId(e.target.value)}
              placeholder="アーティストID"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c2185b]"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-gray-500 mb-1">年</label>
            <input
              type="number"
              value={genYear}
              onChange={(e) => setGenYear(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c2185b]"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-gray-500 mb-1">月</label>
            <select
              value={genMonth}
              onChange={(e) => setGenMonth(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#c2185b]"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}月</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg bg-[#c2185b] px-6 py-2 text-sm font-semibold text-white hover:bg-[#880e4f] disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : "生成する"}
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">対象期間</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">アーティスト</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">合計金額</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">ステータス</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">アクション</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{inv.periodStart} 〜</p>
                  <p className="text-xs text-gray-400">{inv.periodEnd}</p>
                </td>
                <td className="px-4 py-3 font-medium text-gray-700">
                  {inv.artistName}
                </td>
                <td className="px-4 py-3 text-right font-bold text-[#c2185b]">
                  ¥{inv.totalAmount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusLabels[inv.status]?.class}`}>
                    {statusLabels[inv.status]?.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`/api/admin/invoices/${inv.id}/pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#c2185b] hover:text-[#880e4f] font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-500">{page} / {pagination.totalPages}</span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
