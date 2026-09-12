"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, Image as ImageIcon } from "lucide-react";
import ImageUploadInput from "@/components/admin/ImageUploadInput";
import ConfirmModal from "@/components/ui/ConfirmModal";
import toast from "react-hot-toast";
import RichTextEditor from "@/components/admin/RichTextEditor";

interface Category {
  id: string;
  name: string;
}

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    body: "",
    thumbnailUrl: "",
    isPublished: false,
    categoryIds: [] as string[],
  });

  const [uploadingBodyImage, setUploadingBodyImage] = useState(false);
  const bodyFileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/blogs/${id}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([blogData, catData]) => {
      if (blogData.success) {
        const b = blogData.data;
        setForm({
          title: b.title,
          slug: b.slug || "",
          body: b.body,
          thumbnailUrl: b.thumbnailUrl || "",
          isPublished: b.isPublished,
          categoryIds: b.categoryIds || [],
        });
      }
      if (catData.success) setCategories(catData.data);
      setLoading(false);
    });
  }, [id]);

  function toggleCategory(catId: string) {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId)
        ? prev.categoryIds.filter((c) => c !== catId)
        : [...prev.categoryIds, catId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("ブログ記事を更新しました");
        router.push("/admin/blogs");
      } else {
        setError(data.error || "更新に失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("ブログ記事を削除しました");
        router.push("/admin/blogs");
      } else {
        toast.error(data.error || "削除に失敗しました");
      }
    } catch {
      toast.error("エラーが発生しました");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  const inputClass =
    "block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">ブログ編集</h1>

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
            className={`mt-1.5 ${inputClass}`}
          />
          <p className="mt-1 text-xs text-gray-500">
            <a 
              href={`https://makele.jp/blog/${form.slug}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#c2185b] hover:underline"
            >
              makele.jp/blog/<span className="font-semibold">{form.slug}</span>
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
            <span className="text-sm text-gray-700">公開する</span>
          </label>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            削除する
          </button>

          <div className="flex gap-3">
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
              更新する
            </button>
          </div>
        </div>
      </form>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="ブログ記事の削除"
        message="このブログ記事を完全に削除します。この操作は取り消せません。本当によろしいですか？"
        confirmText="削除する"
        cancelText="キャンセル"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isDestructive={true}
      />
    </div>
  );
}
