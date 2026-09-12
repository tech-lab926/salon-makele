"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

interface Area {
  id: string;
  prefecture: string;
  city: string | null;
}

interface Category {
  id: string;
  name: string;
}

export default function NewArtistPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    bio: "",
    areaId: "",
    profileImgUrl: "",
    isPublished: false,
    skillCategoryIds: [] as string[],
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/areas").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([areaData, categoryData]) => {
      if (areaData.success) setAreas(areaData.data);
      if (categoryData.success) setCategories(categoryData.data);
      setLoading(false);
    });
  }, []);

  function toggleSkill(categoryId: string) {
    setForm((prev) => ({
      ...prev,
      skillCategoryIds: prev.skillCategoryIds.includes(categoryId)
        ? prev.skillCategoryIds.filter((id) => id !== categoryId)
        : [...prev.skillCategoryIds, categoryId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/admin/artists");
      } else {
        setError(data.error || "登録に失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  const inputClass =
    "block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">アーティスト登録</h1>
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              初期パスワード <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            表示名 <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={form.displayName}
            onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">自己紹介</label>
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              エリア <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.areaId}
              onChange={(e) => setForm((prev) => ({ ...prev, areaId: e.target.value }))}
              className={`mt-1.5 ${inputClass}`}
            >
              <option value="">選択してください</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.prefecture}
                  {area.city ? ` ${area.city}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              プロフィール画像URL
            </label>
            <input
              value={form.profileImgUrl}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, profileImgUrl: e.target.value }))
              }
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">得意カテゴリ</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleSkill(category.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  form.skillCategoryIds.includes(category.id)
                    ? "bg-[#c2185b] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-[#c2185b]"
          />
          <span className="text-sm font-medium text-gray-700">公開する</span>
        </label>

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
            登録する
          </button>
        </div>
      </form>
    </div>
  );
}
