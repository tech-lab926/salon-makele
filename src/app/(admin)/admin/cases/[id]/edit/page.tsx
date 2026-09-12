"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import ImageUploadInput from "@/components/admin/ImageUploadInput";

interface Category { id: string; name: string; techniques: { id: string; name: string }[]; }

export default function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "", description: "", categoryId: "", techniqueId: "",
    beforeImgUrl: "", afterImgUrl: "", sessionCount: "", downtimeDays: "",
    downtimeNote: "", isPublished: false, isSponsored: false, priorityRank: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/cases/${id}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([caseData, catData]) => {
      if (caseData.success) {
        const c = caseData.data;
        setForm({
          title: c.title, description: c.description,
          categoryId: c.categoryId, techniqueId: c.techniqueId || "",
          beforeImgUrl: c.beforeImgUrl, afterImgUrl: c.afterImgUrl,
          sessionCount: c.sessionCount?.toString() || "",
          downtimeDays: c.downtimeDays?.toString() || "",
          downtimeNote: c.downtimeNote || "", isPublished: c.isPublished,
          isSponsored: c.isSponsored || false, priorityRank: c.priorityRank || 0,
        });
      }
      if (catData.success) setCategories(catData.data);
      setLoading(false);
    });
  }, [id]);

  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  function updateField(field: string, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "categoryId") setForm((prev) => ({ ...prev, categoryId: value as string, techniqueId: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); 

    const descLen = form.description.length;
    if (descLen < 300 || descLen > 500) {
      setError(`説明文は300〜500文字で入力してください。（現在の文字数: ${descLen}文字）`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/cases/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sessionCount: form.sessionCount ? Number(form.sessionCount) : null,
          downtimeDays: form.downtimeDays ? Number(form.downtimeDays) : null,
          techniqueId: form.techniqueId || null,
        }),
      });
      const data = await res.json();
      if (data.success) router.push("/admin/cases");
      else setError(data.error || "更新に失敗しました");
    } catch { setError("エラーが発生しました"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" /></div>;

  const inputClass = "block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">症例の編集（管理者）</h1>
      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">タイトル <span className="text-red-500">*</span></label>
          <input type="text" required value={form.title} onChange={(e) => updateField("title", e.target.value)} className={`mt-1.5 ${inputClass}`} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">カテゴリ</label>
            <select value={form.categoryId} onChange={(e) => updateField("categoryId", e.target.value)} className={`mt-1.5 ${inputClass} custom-select`}>
              <option value="">選択</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">技法</label>
            <select value={form.techniqueId} onChange={(e) => updateField("techniqueId", e.target.value)} className={`mt-1.5 ${inputClass} custom-select`} disabled={!selectedCategory}>
              <option value="">選択</option>
              {selectedCategory?.techniques.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">説明</label>
          <textarea rows={5} value={form.description} onChange={(e) => updateField("description", e.target.value)} className={`mt-1.5 ${inputClass}`} />
          <p className={`mt-1.5 text-xs ${form.description.length < 300 || form.description.length > 500 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
            現在の文字数: {form.description.length} / 300〜500文字
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <ImageUploadInput
              label="Before画像URL"
              value={form.beforeImgUrl}
              onChange={(val) => updateField("beforeImgUrl", val)}
            />
          </div>
          <div>
            <ImageUploadInput
              label="After画像URL"
              value={form.afterImgUrl}
              onChange={(val) => updateField("afterImgUrl", val)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">施術回数</label>
            <input type="number" min="1" step="1" onKeyDown={(e) => { if (e.key === '-' || e.key === '.') e.preventDefault(); }} value={form.sessionCount} onChange={(e) => updateField("sessionCount", e.target.value)} className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ダウンタイム（日）</label>
            <input type="number" min="0" step="1" onKeyDown={(e) => { if (e.key === '-' || e.key === '.') e.preventDefault(); }} value={form.downtimeDays} onChange={(e) => updateField("downtimeDays", e.target.value)} className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">ダウンタイム補足</label>
            <input value={form.downtimeNote} onChange={(e) => updateField("downtimeNote", e.target.value)} className={`mt-1.5 ${inputClass}`} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg bg-gray-50 p-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => updateField("isPublished", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#c2185b]" />
            <span className="text-sm font-medium text-gray-700">公開する</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isSponsored} onChange={(e) => updateField("isSponsored", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#c2185b]" />
            <span className="text-sm font-medium text-gray-700">スポンサー枠（上位固定表示）</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700">優先順位スコア (Priority Rank)</label>
            <input type="number" min="0" step="1" onKeyDown={(e) => { if (e.key === '-' || e.key === '.') e.preventDefault(); }} value={form.priorityRank} onChange={(e) => updateField("priorityRank", Number(e.target.value))} className={`mt-1.5 ${inputClass}`} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">キャンセル</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#c2185b] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#880e4f] disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            更新する
          </button>
        </div>
      </form>
    </div>
  );
}
