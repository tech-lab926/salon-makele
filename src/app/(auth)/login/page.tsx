"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { mutate } from "swr";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { isDemoAuthEnabledClient, isGoogleSignInEnabledClient } from "@/lib/runtime-flags";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { sanitizeAppPath } from "@/lib/safe-redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoAuthEnabled = isDemoAuthEnabledClient();
  const redirectTo = searchParams.get("redirect");
  const justRegistered = searchParams.get("registered") === "true";
  const googleEnabled = isGoogleSignInEnabledClient();
  const oauthNext = sanitizeAppPath(redirectTo ?? "", "");
  const oauthDoneHref =
    oauthNext !== ""
      ? `/login/oauth-done?next=${encodeURIComponent(oauthNext)}`
      : "/login/oauth-done";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "ログインに失敗しました");
        return;
      }

      await mutate("/api/auth/me");

      if (oauthNext !== "") {
        router.push(oauthNext);
      } else if (data.data.role === "admin") {
        router.push("/admin");
      } else if (data.data.role === "artist") {
        router.push("/dashboard");
      } else {
        router.push("/mypage");
      }
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(role: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error);
      }

      // Force refresh auth state
      await mutate("/api/auth/me");

      // Redirect based on role
      router.push(data.data.redirectUrl);
      
      // Ensure page state is fully cleared
      window.location.href = data.data.redirectUrl;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "デモログインに失敗しました");
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
            おかえりなさい
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            アカウントにログインしてください
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
        >
          {justRegistered && (
            <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">アカウントの登録が完了しました。</p>
                  <p className="mt-1 text-green-700/90">
                    メールを確認して、届いた確認リンクをクリックしてからログインしてください。
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-5">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
                  placeholder="パスワードを入力"
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
          </div>

          <div className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-gray-400 hover:text-[#c2185b] hover:underline"
            >
              パスワードをお忘れですか？
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-[#c2185b] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#880e4f] disabled:opacity-50"
          >
            {loading ? "ログイン中..." : "ログイン"}
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
              <GoogleSignInButton callbackUrl={oauthDoneHref} disabled={loading} />
              <p className="mt-3 text-center text-[11px] text-gray-400">
                アーティストはGoogleフォト連携のために、初回のみGoogleの写真アクセスを許可してください。
              </p>
            </>
          ) : null}

          <p className="mt-6 text-center text-sm text-gray-500">
            アカウントをお持ちでない方は{" "}
            <Link
              href="/register"
              className="font-medium text-[#c2185b] hover:underline"
            >
              新規登録はこちら
            </Link>
          </p>

          {demoAuthEnabled ? (
            <div className="mt-10 border-t border-gray-100 pt-8">
              <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Demo Persona Access
              </p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("artist")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-pink-100 bg-pink-50/30 py-3 text-sm font-semibold text-[#c2185b] transition-all hover:bg-pink-50"
                >
                  <span>Login as Demo Artist</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("admin")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-100 bg-gray-50/30 py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50"
                >
                  <span>Login as Demo Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("user")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50/30 py-3 text-sm font-semibold text-rose-600 transition-all hover:bg-rose-50"
                >
                  <span>Login as Demo User</span>
                </button>
              </div>
              <p className="mt-4 text-center text-[10px] text-gray-400">
                One-click access for client demonstration purposes only.
              </p>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#c2185b]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
