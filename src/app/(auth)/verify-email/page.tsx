"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Suspense } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const hasToken = Boolean(token);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!hasToken) {
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage("メールアドレスの確認が完了しました");
        } else {
          setStatus("error");
          setMessage(data.error || "確認に失敗しました");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("エラーが発生しました");
      });
  }, [hasToken, token]);

  const resolvedStatus = hasToken ? status : "error";
  const resolvedMessage = hasToken ? message : "トークンが見つかりません";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 px-4">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="text-3xl font-bold text-[#c2185b]">
          MAKELE
        </Link>

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          {resolvedStatus === "loading" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#c2185b]" />
              <p className="mt-4 text-gray-500">確認中...</p>
            </>
          )}

          {resolvedStatus === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <h1 className="mt-4 text-xl font-bold text-gray-900">
                {resolvedMessage}
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                ログインしてMAKELEをお楽しみください。
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block rounded-lg bg-[#c2185b] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#880e4f]"
              >
                ログインページへ
              </Link>
            </>
          )}

          {resolvedStatus === "error" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
              <h1 className="mt-4 text-xl font-bold text-gray-900">
                確認できませんでした
              </h1>
              <p className="mt-2 text-sm text-gray-500">{resolvedMessage}</p>
              <Link
                href="/register"
                className="mt-6 inline-block rounded-lg bg-[#c2185b] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#880e4f]"
              >
                再登録する
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
