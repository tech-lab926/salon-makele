"use client";

import { useState } from "react";
import { Mail, CheckCircle2, Loader2, Send } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "送信に失敗しました");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">送信完了</h1>
        <p className="mx-auto mt-4 max-w-md text-gray-600">
          お問い合わせを受け付けました。
          ご入力いただいたメールアドレス宛に確認メールを送信しております。
          担当者より順次ご返信いたしますので、今しばらくお待ちください。
        </p>
        <div className="mt-8">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-[#c2185b] px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-[#880e4f] shadow-sm hover:shadow-md"
          >
            トップページへ戻る
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pink-50">
          <Mail className="h-6 w-6 text-[#c2185b]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">お問い合わせ</h1>
        <p className="mt-4 text-sm text-gray-600">
          MAKELEに関するご質問、ご要望などはこちらからお気軽にお問い合わせください。
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900">
              お名前 <span className="text-[#c2185b]">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              placeholder="山田 太郎"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#c2185b] focus:outline-none focus:ring-1 focus:ring-[#c2185b] sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900">
              メールアドレス <span className="text-[#c2185b]">*</span>
            </label>
            <input
              type="email"
              id="email"
              required
              placeholder="taro@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#c2185b] focus:outline-none focus:ring-1 focus:ring-[#c2185b] sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-gray-900">
              件名 <span className="text-[#c2185b]">*</span>
            </label>
            <input
              type="text"
              id="subject"
              required
              placeholder="サービスについて"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#c2185b] focus:outline-none focus:ring-1 focus:ring-[#c2185b] sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-900">
              お問い合わせ内容 <span className="text-[#c2185b]">*</span>
            </label>
            <textarea
              id="message"
              required
              rows={6}
              placeholder="お問い合わせ内容を詳しくご記入ください..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="mt-2 block w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-[#c2185b] focus:outline-none focus:ring-1 focus:ring-[#c2185b] sm:text-sm"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c2185b] px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#880e4f] hover:shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  送信する
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
