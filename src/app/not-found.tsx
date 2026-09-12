import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-7xl font-bold text-[#c2185b]">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          ページが見つかりません
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          お探しのページは移動・削除されたか、URLが間違っている可能性があります。
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-[#c2185b] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#880e4f]"
          >
            <Home className="h-4 w-4" />
            トップへ
          </Link>
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <Search className="h-4 w-4" />
            症例を探す
          </Link>
          <Link
            href="/artists"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            アーティスト一覧
          </Link>
        </div>
      </div>
    </div>
  );
}
