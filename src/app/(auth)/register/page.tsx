"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { isGoogleSignInEnabledClient } from "@/lib/runtime-flags";

export default function RegisterPage() {
  const router = useRouter();
  const googleEnabled = isGoogleSignInEnabledClient();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (form.password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: "user",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "登録に失敗しました");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-[#c2185b]">
            MAKELE
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            アカウント作成
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            一般ユーザーとして登録できます。アーティストの方は{" "}
            <Link href="/register/artist" className="font-medium text-[#c2185b] hover:underline">
              アーティスト登録ページ
            </Link>
            へ。
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                お名前
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
                placeholder="山田 太郎"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                パスワード
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
                  placeholder="8文字以上で入力"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                パスワード確認
              </label>
              <div className="relative mt-1.5">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
                  placeholder="パスワードを再入力"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-[#c2185b] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#880e4f] disabled:opacity-50"
          >
            {loading ? "登録中..." : "アカウント作成"}
          </button>

          {googleEnabled ? (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-white px-4 text-gray-400">または</span>
                </div>
              </div>
              <GoogleSignInButton callbackUrl="/login/oauth-done" disabled={loading} />
              <p className="mt-3 text-center text-[11px] text-gray-400">
                Googleで登録すると一般ユーザーとして自動登録されます。アーティスト登録とは別フローです。
              </p>
            </>
          ) : null}

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/register/artist" className="font-medium text-[#c2185b] hover:underline">
              アーティストとして登録する
            </Link>
            {" · "}
            すでにアカウントの方は{" "}
            <Link href="/login" className="font-medium text-[#c2185b] hover:underline">
              ログイン
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
