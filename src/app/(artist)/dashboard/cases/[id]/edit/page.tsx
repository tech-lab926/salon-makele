"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import ImageUpload from "@/components/ui/ImageUpload";
import GooglePhotosPicker from "@/components/artist/GooglePhotosPicker";

interface Category {
  id: string;
  name: string;
  slug: string;
  techniques: { id: string; name: string }[];
}

export default function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [skillCategoryIds, setSkillCategoryIds] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    techniqueId: "",
    menuId: "",
    beforeImgUrl: "",
    afterImgUrl: "",
    sessionCount: "",
    downtimeDays: "",
    downtimeNote: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/artist/menus").then((r) => r.json()),
      fetch(`/api/artist/cases/${id}`).then((r) => r.json()),
      fetch("/api/artist/profile").then((r) => r.json()),
    ]).then(([catData, menuData, caseData, profileData]) => {
      if (profileData.success && Array.isArray(profileData.data.skills)) {
        setSkillCategoryIds(new Set(profileData.data.skills as string[]));
      }
      if (catData.success) setCategories(catData.data);
      if (menuData.success) setMenus(menuData.data);
      if (caseData.success) {
        const c = caseData.data;
        setForm({
          title: c.title || "",
          description: c.description || "",
          categoryId: c.categoryId || "",
          techniqueId: c.techniqueId || "",
          menuId: c.menuId || "",
          beforeImgUrl: c.beforeImgUrl || "",
          afterImgUrl: c.afterImgUrl || "",
          sessionCount: c.sessionCount?.toString() || "",
          downtimeDays: c.downtimeDays?.toString() || "",
          downtimeNote: c.downtimeNote || "",
        });
      }
      setLoading(false);
    });
  }, [id]);

  const allowedCategories = categories.filter((c) => skillCategoryIds.size === 0 || skillCategoryIds.has(c.id));
  const selectedCategory = allowedCategories.find((c) => c.id === form.categoryId);
  const categoryMenus = menus.filter((m) => m.categoryId === form.categoryId && m.isActive);

  function updateField(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "categoryId") {
        next.techniqueId = "";
        next.menuId = "";
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/artist/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sessionCount: form.sessionCount ? Number(form.sessionCount) : null,
          downtimeDays: form.downtimeDays ? Number(form.downtimeDays) : null,
          techniqueId: form.techniqueId || null,
          menuId: form.menuId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/dashboard/cases");
      } else {
        setError(data.error || "更新に失敗しました");
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

  const selectClass =
    `${inputClass} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20fill%3D%27none%27%20viewBox%3D%270%200%2020%2020%27%3E%3Cpath%20stroke%3D%27%239CA3AF%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20stroke-width%3D%271.5%27%20d%3D%27m6%208%204%204%204-4%27%2F%3E%3C%2Fsvg%3E')] bg-[length:1.125rem_1.125rem] bg-[position:right_0.875rem_center] bg-no-repeat pr-10 cursor-pointer`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">症例の編集</h1>

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
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => updateField("categoryId", e.target.value)}
              className={`mt-1.5 ${selectClass}`}
            >
              <option value="">選択してください</option>
              {allowedCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">技法</label>
            <select
              value={form.techniqueId}
              onChange={(e) => updateField("techniqueId", e.target.value)}
              className={`mt-1.5 ${selectClass}`}
              disabled={!selectedCategory}
            >
              <option value="">選択してください</option>
              {selectedCategory?.techniques.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">対応するメニュー</label>
            <select
              value={form.menuId}
              onChange={(e) => updateField("menuId", e.target.value)}
              className={`mt-1.5 ${selectClass}`}
              disabled={!form.categoryId}
            >
              <option value="">選択しない（メニューなし）</option>
              {categoryMenus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.price ? `¥${m.price.toLocaleString("ja-JP")}` : "要相談"})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            説明 <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            className={`mt-1.5 ${inputClass}`}
          />
          <p className="mt-1 text-xs text-gray-400">{form.description.length}文字</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-3">
            <ImageUpload
              label="Before画像"
              value={form.beforeImgUrl}
              onChange={(url) => updateField("beforeImgUrl", url)}
              required
            />
            <GooglePhotosPicker slotLabel="Before画像" onPick={(url) => updateField("beforeImgUrl", url)} />
          </div>
          <div className="space-y-3">
            <ImageUpload
              label="After画像"
              value={form.afterImgUrl}
              onChange={(url) => updateField("afterImgUrl", url)}
              required
            />
            <GooglePhotosPicker slotLabel="After画像" onPick={(url) => updateField("afterImgUrl", url)} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">施術回数</label>
            <input
              type="number"
              min="1"
              step="1"
              onKeyDown={(e) => { if (e.key === '-' || e.key === '.') e.preventDefault(); }}
              value={form.sessionCount}
              onChange={(e) => updateField("sessionCount", e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ダウンタイム（日数）</label>
            <input
              type="number"
              min="0"
              step="1"
              onKeyDown={(e) => { if (e.key === '-' || e.key === '.') e.preventDefault(); }}
              value={form.downtimeDays}
              onChange={(e) => updateField("downtimeDays", e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ダウンタイムの補足</label>
            <input
              type="text"
              value={form.downtimeNote}
              onChange={(e) => updateField("downtimeNote", e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
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
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            更新する
          </button>
        </div>
      </form>
    </div>
  );
}
