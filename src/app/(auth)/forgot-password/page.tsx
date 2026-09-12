"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(data.message);
      } else {
        setError(data.error);
      }
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-[#c2185b]">
            MAKELE
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            パスワードをお忘れですか？
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            ご登録のメールアドレスを入力してください。<br/>
            パスワード再設定用のリンクをお送りします。
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          {message ? (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">メールを送信しました</h2>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {message}<br/>
                メールが届かない場合は、迷惑メールフォルダをご確認ください。
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#c2185b] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                ログインに戻る
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  メールアドレス
                </label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#c2185b] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#880e4f] disabled:opacity-50"
              >
                {loading ? "送信中..." : "再設定リンクを送信"}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#c2185b]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  ログインに戻る
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
