"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">
          エラーが発生しました
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          申し訳ございません。予期しないエラーが発生しました。
          しばらくしてからもう一度お試しください。
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <RotateCcw className="h-4 w-4" />
            再試行
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#c2185b] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#880e4f]"
          >
            <Home className="h-4 w-4" />
            トップへ
          </Link>
        </div>
      </div>
    </div>
  );
}
