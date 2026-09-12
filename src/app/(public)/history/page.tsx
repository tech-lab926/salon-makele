"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Clock, ImageIcon } from "lucide-react";

interface HistoryItem {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  viewedAt: string;
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/view-history")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setItems(data.data);
        } else {
          setError(data.error || "");
        }
      })
      .catch(() => setError("履歴の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-gray-500">{error === "Authentication required" ? "閲覧履歴を表示するにはログインが必要です" : error}</p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-lg bg-[#c2185b] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#880e4f]"
        >
          ログイン
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">閲覧履歴</h1>
      <p className="mt-1 text-sm text-gray-500">最近閲覧したページ（最新20件）</p>

      {items.length === 0 ? (
        <div className="mt-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">閲覧履歴はまだありません</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item: any, idx: number) => (
            <Link
              key={`${item.type}-${item.id}-${idx}`}
              href={item.type === "artist" ? `/artists/${item.id}` : `/cases/${item.id}`}
              className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:border-pink-200"
            >
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.title} width={56} height={56} className="h-full w-full object-cover"  unoptimized={true} />
                ) : (
                  <ImageIcon className="h-6 w-6 text-gray-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{item.title}</p>
                <p className="mt-0.5 text-sm text-gray-500">{item.subtitle}</p>
              </div>
              <div className="shrink-0 text-right">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {item.type === "artist" ? "アーティスト" : "症例"}
                </span>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(item.viewedAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
