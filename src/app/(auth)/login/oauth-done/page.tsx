"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mutate } from "swr";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { sanitizeAppPath } from "@/lib/safe-redirect";

function OAuthDoneInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRaw = searchParams.get("next");
  const nextSafe = sanitizeAppPath(nextRaw, "");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (cancelled) return;
      if (!data.success || !data.data) {
        setError("ログインに失敗しました。もう一度お試しください。");
        return;
      }
      await mutate("/api/auth/me", data.data, { revalidate: false });
      const dest = nextSafe || data.data.dashboardUrl || "/";
      router.replace(dest);
    })();
    return () => {
      cancelled = true;
    };
  }, [router, nextSafe]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 px-4">
        <p className="text-center text-sm text-red-600">{error}</p>
        <Link href="/login" className="mt-4 text-sm font-medium text-[#c2185b] hover:underline">
          ログインへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 px-4">
      <Loader2 className="h-10 w-10 animate-spin text-[#c2185b]" />
      <p className="mt-4 text-sm text-gray-500">ログイン処理中…</p>
    </div>
  );
}

export default function OAuthDonePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
        </div>
      }
    >
      <OAuthDoneInner />
    </Suspense>
  );
}
