"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, FileText, ExternalLink } from "lucide-react";
import ImageUploadInput from "@/components/admin/ImageUploadInput";
import ConfirmModal from "@/components/ui/ConfirmModal";
import toast from "react-hot-toast";

interface Area { id: string; prefecture: string; city: string | null; }
interface Category { id: string; name: string; }

function DocumentPreview({ url }: { url: string }) {
  if (!url) return null;
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  const fileName = url.split('/').pop() || "ドキュメント";
  
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="mt-3 block overflow-hidden rounded-lg border border-pink-200 bg-white hover:bg-pink-50 transition-colors w-32 h-32 relative flex flex-col items-center justify-center group"
    >
      {isImage ? (
        <img src={url} alt="Preview" className="w-full h-full object-cover" />
      ) : (
        <>
          <FileText className="w-8 h-8 text-pink-400 mb-2" />
          <span className="text-xs text-gray-500 text-center px-2 break-all w-full line-clamp-3">{fileName}</span>
        </>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
        <ExternalLink className="w-5 h-5 text-white mb-1" />
        <span className="text-[10px] font-medium text-white">別タブで開く</span>
      </div>
    </a>
  );
}

export default function EditArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    areaId: "",
    profileImgUrl: "",
    isPublished: false,
    isSponsored: false,
    priorityRank: 0,
    skillCategoryIds: [] as string[],
    registrationStatus: "PROVISIONAL",
    medicalLicenseUrl: "",
    artmakeDiplomaUrl: "",
    clinicName: "",
    clinicAddress: "",
    businessHours: "",
    yearsOfExperience: "" as number | "",
    instagramUrl: "",
    twitterUrl: "",
    lineUrl: "",
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/artists/${id}`).then((r) => r.json()),
      fetch("/api/areas").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([artistData, areaData, catData]) => {
      if (artistData.success) {
        const a = artistData.data;
        setForm({
          displayName: a.displayName,
          bio: a.bio || "",
          areaId: a.areaId,
          profileImgUrl: a.profileImgUrl || "",
          isPublished: a.isPublished,
          isSponsored: a.isSponsored || false,
          priorityRank: a.priorityRank || 0,
          skillCategoryIds: a.skillCategoryIds || [],
          registrationStatus: a.registrationStatus || "PROVISIONAL",
          medicalLicenseUrl: a.medicalLicenseUrl || "",
          artmakeDiplomaUrl: a.artmakeDiplomaUrl || "",
          clinicName: a.clinicName || "",
          clinicAddress: a.clinicAddress || "",
          businessHours: a.businessHours || "",
          yearsOfExperience: a.yearsOfExperience ?? "",
          instagramUrl: a.instagramUrl || "",
          twitterUrl: a.twitterUrl || "",
          lineUrl: a.lineUrl || "",
        });
      }
      if (areaData.success) setAreas(areaData.data);
      if (catData.success) setCategories(catData.data);
      setLoading(false);
    });
  }, [id]);

  function toggleSkill(catId: string) {
    setForm((prev) => ({
      ...prev,
      skillCategoryIds: prev.skillCategoryIds.includes(catId)
        ? prev.skillCategoryIds.filter((c) => c !== catId)
        : [...prev.skillCategoryIds, catId],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/artists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) router.push("/admin/artists");
      else setError(data.error || "更新に失敗しました");
    } catch {
      setError("エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/artists/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("アーティストを削除しました");
        router.push("/admin/artists");
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
    "block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">アーティスト編集</h1>
      {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">表示名 <span className="text-red-500">*</span></label>
          <input required value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))} className={`mt-1.5 ${inputClass}`} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">自己紹介</label>
          <textarea rows={4} value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} className={`mt-1.5 ${inputClass}`} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">エリア</label>
            <select value={form.areaId} onChange={(e) => setForm((p) => ({ ...p, areaId: e.target.value }))} className={`mt-1.5 ${inputClass}`}>
              <option value="">選択してください</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.prefecture}{a.city ? ` ${a.city}` : ""}</option>)}
            </select>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <ImageUploadInput
              label="プロフィール画像URL"
              value={form.profileImgUrl}
              onChange={(url) => setForm((p) => ({ ...p, profileImgUrl: url }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">在籍クリニック名</label>
            <input value={form.clinicName} onChange={(e) => setForm((p) => ({ ...p, clinicName: e.target.value }))} className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">クリニック住所</label>
            <input value={form.clinicAddress} onChange={(e) => setForm((p) => ({ ...p, clinicAddress: e.target.value }))} className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">営業時間</label>
            <input value={form.businessHours} onChange={(e) => setForm((p) => ({ ...p, businessHours: e.target.value }))} className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">経験年数 (年)</label>
            <input type="number" min="0" value={form.yearsOfExperience} onChange={(e) => setForm((p) => ({ ...p, yearsOfExperience: e.target.value === "" ? "" : Number(e.target.value) }))} className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Instagram URL</label>
            <input value={form.instagramUrl} onChange={(e) => setForm((p) => ({ ...p, instagramUrl: e.target.value }))} placeholder="https://instagram.com/..." className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">X (Twitter) URL</label>
            <input value={form.twitterUrl} onChange={(e) => setForm((p) => ({ ...p, twitterUrl: e.target.value }))} placeholder="https://x.com/..." className={`mt-1.5 ${inputClass}`} />
          </div>
          <div className="col-span-full sm:col-span-1">
            <label className="text-sm font-medium text-gray-700">LINE URL</label>
            <input value={form.lineUrl} onChange={(e) => setForm((p) => ({ ...p, lineUrl: e.target.value }))} placeholder="https://line.me/..." className={`mt-1.5 ${inputClass}`} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg bg-pink-50 p-4 border border-pink-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              医師免許・看護師免許
            </label>
            {form.medicalLicenseUrl ? (
              <DocumentPreview url={form.medicalLicenseUrl} />
            ) : (
              <p className="text-sm text-gray-500">未提出</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              アートメイクディプロマ
            </label>
            {form.artmakeDiplomaUrl ? (
              <DocumentPreview url={form.artmakeDiplomaUrl} />
            ) : (
              <p className="text-sm text-gray-500">未提出</p>
            )}
          </div>
          <div className="col-span-1 sm:col-span-2 pt-2 border-t border-pink-200 mt-2">
            <label className="block text-sm font-medium text-gray-700">審査ステータス</label>
            <select value={form.registrationStatus} onChange={(e) => setForm((p) => ({ ...p, registrationStatus: e.target.value }))} className={`mt-1.5 ${inputClass.replace("w-full", "w-full sm:max-w-md")}`}>
              <option value="PROVISIONAL">仮登録 (PROVISIONAL)</option>
              <option value="APPROVED">承認済 (APPROVED) - 承認メールが送信されます</option>
              <option value="REJECTED">却下 (REJECTED)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">得意カテゴリ</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c.id} type="button" onClick={() => toggleSkill(c.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${form.skillCategoryIds.includes(c.id) ? "bg-[#c2185b] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >{c.name}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg bg-gray-50 p-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-[#c2185b]" />
            <span className="text-sm font-medium text-gray-700">公開する</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isSponsored} onChange={(e) => setForm((p) => ({ ...p, isSponsored: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-[#c2185b]" />
            <span className="text-sm font-medium text-gray-700">スポンサー枠（上位固定表示）</span>
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700">優先順位スコア (Priority Rank)</label>
            <input type="number" min="0" value={form.priorityRank} onChange={(e) => setForm((p) => ({ ...p, priorityRank: Number(e.target.value) }))} className={`mt-1.5 ${inputClass}`} />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            削除する
          </button>
          
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">キャンセル</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-[#c2185b] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#880e4f] disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              更新する
            </button>
          </div>
        </div>
      </form>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="アーティストアカウントの削除"
        message="このアーティストアカウントと、関連するすべてのデータ（症例、予約履歴など）を完全に削除します。この操作は取り消せません。本当によろしいですか？"
        confirmText="削除する"
        cancelText="キャンセル"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isDestructive={true}
      />
    </div>
  );
}
