"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ChevronLeft, Pencil, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

interface CaseDetail {
  id: string;
  artistId: string;
  title: string;
  description: string;
  categoryId: string;
  techniqueId: string;
  beforeImgUrl: string;
  afterImgUrl: string;
  sessionCount: number | null;
  downtimeDays: number | null;
  downtimeNote: string | null;
  isPublished: boolean;
  isSponsored: boolean;
  priorityRank: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  artist: { id: string; displayName: string } | null;
  category: { id: string; name: string } | null;
  technique: { id: string; name: string } | null;
}

export default function AdminCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/cases/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCaseData(data.data);
        } else {
          setError(data.error || "症例の取得に失敗しました");
        }
      })
      .catch(() => setError("エラーが発生しました"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        {error || "症例が見つかりません"}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">症例詳細</h1>
          {caseData.isPublished ? (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
              <Eye className="h-4 w-4" /> 公開中
            </span>
          ) : (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-600">
              <EyeOff className="h-4 w-4" /> 未公開
            </span>
          )}
        </div>
        <div>
          <Link
            href={`/admin/cases/${id}/edit`}
            className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            編集する
          </Link>
        </div>
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
                <div className="col-span-2 text-sm font-medium text-gray-900">{caseData.id}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">タイトル</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">{caseData.title}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">アーティスト</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {caseData.artist?.displayName || "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">カテゴリ</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {caseData.category?.name || "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">技法</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {caseData.technique?.name || "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">施術回数</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {caseData.sessionCount ? `${caseData.sessionCount}回` : "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">ダウンタイム</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {caseData.downtimeDays ? `${caseData.downtimeDays}日` : "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">ダウンタイム補足</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {caseData.downtimeNote || "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">メタ情報</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">閲覧数</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">{caseData.viewCount.toLocaleString()} 回</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">スポンサー枠</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {caseData.isSponsored ? "はい" : "いいえ"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">優先順位スコア</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">{caseData.priorityRank}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">作成日時</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {new Date(caseData.createdAt).toLocaleString("ja-JP")}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">更新日時</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {new Date(caseData.updatedAt).toLocaleString("ja-JP")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">画像</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Before</div>
                  {caseData.beforeImgUrl ? (
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200">
                      <Image
                        src={caseData.beforeImgUrl}
                        alt="Before"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                      <span className="text-sm text-gray-400">画像なし</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">After</div>
                  {caseData.afterImgUrl ? (
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200">
                      <Image
                        src={caseData.afterImgUrl}
                        alt="After"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
                      <span className="text-sm text-gray-400">画像なし</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">説明文</h2>
            </div>
            <div className="p-6">
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
                {caseData.description}
              </div>
              <div className="mt-2 text-right text-xs text-gray-500">
                文字数: {caseData.description.length} 文字
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
