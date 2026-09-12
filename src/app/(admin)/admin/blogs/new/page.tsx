"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Image as ImageIcon } from "lucide-react";
import ImageUploadInput from "@/components/admin/ImageUploadInput";
import toast from "react-hot-toast";

import RichTextEditor from "@/components/admin/RichTextEditor";

interface Category {
  id: string;
  name: string;
}

export default function NewBlogPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    slug: "",
    body: "",
    thumbnailUrl: "",
    categoryIds: [] as string[],
    isPublished: false,
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCategories(
            data.data.map((c: { id: string; name: string }) => ({
              id: c.id,
              name: c.name,
            })),
          );
        }
      });
  }, []);

  function toggleCategory(id: string) {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/admin/blogs");
      } else {
        setError(data.error || "作成に失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">新規ブログ作成</h1>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">
            タイトル *
          </label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="記事のタイトル"
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            パーマリンク（URLスラッグ） *
          </label>
          <input
            required
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value.trim().replace(/\s+/g, '-') })}
            placeholder="example-post-url"
            className={`mt-1.5 ${inputClass}`}
          />
          <p className="mt-1 text-xs text-gray-500">
            <a 
              href={`https://makele.jp/blog/${form.slug}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#c2185b] hover:underline"
            >
              makele.jp/blog/<span className="font-semibold">{form.slug || "..."}</span>
            </a>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            本文 *
          </label>
          <RichTextEditor 
            value={form.body} 
            onChange={(val) => setForm({ ...form, body: val })} 
          />
        </div>

        <ImageUploadInput
          label="サムネイルURL"
          value={form.thumbnailUrl}
          onChange={(url) => setForm({ ...form, thumbnailUrl: url })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700">
            カテゴリ
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  form.categoryIds.includes(c.id)
                    ? "border-[#c2185b] bg-pink-50 text-[#c2185b]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(e) =>
                setForm({ ...form, isPublished: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-[#c2185b] focus:ring-[#c2185b]"
            />
            <span className="text-sm text-gray-700">すぐに公開する</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#c2185b] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#880e4f] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            作成する
          </button>
        </div>
      </form>
    </div>
  );
}

