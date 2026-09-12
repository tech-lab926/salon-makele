"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Camera, Plus, Trash2, Edit2, Save, X, Loader2, CheckCircle2 } from "lucide-react";
import ImageUploadInput from "@/components/admin/ImageUploadInput";
import ConfirmModal from "@/components/ui/ConfirmModal";
import toast from "react-hot-toast";

interface HeroBanner {
  id: string;
  imageUrl: string;
  mobileImageUrl: string;
  altText: string | null;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export default function AdminHeroPage() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<HeroBanner>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/hero");
      const json = await res.json();
      if (json.success) {
        setBanners(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch banners", error);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (banner: HeroBanner) => {
    setEditingId(banner.id);
    setEditForm(banner);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!editingId) return;
    
    // Strict Aspect Ratio Validation
    if (editForm.imageUrl || editForm.mobileImageUrl) {
      try {
        const validateImage = (url: string, expectedRatio: number, ratioName: string) => {
          return new Promise<void>((resolve, reject) => {
            const img = new window.Image();
            img.onload = () => {
              const actualRatio = img.width / img.height;
              // Allow 5% tolerance
              if (Math.abs(actualRatio - expectedRatio) > 0.05) {
                reject(new Error(`アスペクト比が正しくありません (${ratioName})`));
              } else {
                resolve();
              }
            };
            img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
            img.src = url;
          });
        };

        const validations = [];
        if (editForm.imageUrl) validations.push(validateImage(editForm.imageUrl, 1840/564, "PC用"));
        if (editForm.mobileImageUrl) validations.push(validateImage(editForm.mobileImageUrl, 3022/1408, "スマホ用"));
        
        await Promise.all(validations);
      } catch (err: any) {
        toast.error(err.message || "画像のアスペクト比の検証に失敗しました");
        return;
      }
    }

    setSaving(true);
    try {
      const isNew = editingId === "new";
      const res = await fetch(isNew ? `/api/admin/hero` : `/api/admin/hero/${editingId}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success) {
        if (isNew) {
          setBanners([...banners, json.data]);
        } else {
          setBanners(banners.map(b => b.id === editingId ? { ...b, ...editForm } as HeroBanner : b));
        }
        setEditingId(null);
        toast.success("保存しました");
      } else {
        toast.error("保存に失敗しました");
      }
    } catch (error) {
      console.error("Failed to save banner", error);
      toast.error("エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/hero/${deleteId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setBanners(banners.filter(b => b.id !== deleteId));
        toast.success("削除しました");
      } else {
        toast.error("削除に失敗しました");
      }
    } catch (error) {
      toast.error("エラーが発生しました");
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/hero/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setBanners(banners.map(b => b.id === id ? { ...b, isActive: !currentStatus } : b));
      }
    } catch (error) {
      console.error("Failed to toggle status", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ヒーローバナー管理</h1>
          <p className="mt-1 text-sm text-gray-500">ホームページのトップに表示されるバナー画像を管理します。</p>
        </div>
        <button 
          onClick={() => {
            setEditingId('new');
            setEditForm({ isActive: true, sortOrder: 0 });
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#c2185b] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a8154d]">
          <Plus className="h-4 w-4" />
          新規バナー追加
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {banners.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
            <Camera className="h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-900">バナーがありません</p>
            <p className="mt-1 text-sm text-gray-500">最初のバナーを追加してサイトを飾りましょう。</p>
          </div>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="flex flex-col md:flex-row">
                {/* Banner Preview */}
                <div className="relative aspect-[16/9] w-full md:w-80 lg:w-96">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.altText || "Banner preview"}
                    fill
                    className="object-cover"
                   unoptimized={true} />
                  {!banner.isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-gray-900">非表示中</span>
                    </div>
                  )}
                </div>

                {/* Banner Info / Edit Form */}
                <div className="flex flex-1 flex-col p-6">
                  {editingId === banner.id ? (
                    <div className="space-y-4">
                      <div className="mb-4 space-y-4">
                        <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                          <p className="text-sm text-amber-800 font-bold mb-2">【重要】アップロードする画像の比率について</p>
                          <ul className="text-xs text-amber-700 list-disc pl-4 space-y-1">
                            <li><strong>PC用画像:</strong> アスペクト比 1840：564 でアップロードしてください。</li>
                            <li><strong>スマホ用画像:</strong> アスペクト比 3022：1408 でアップロードしてください。</li>
                            <li>比率が異なる画像は保存できません。</li>
                          </ul>
                        </div>
                        <ImageUploadInput
                          label="PC用画像URL (1840:564)"
                          value={editForm.imageUrl || ""}
                          onChange={(val) => setEditForm({ ...editForm, imageUrl: val })}
                        />
                        <ImageUploadInput
                          label="スマホ用画像URL (3022:1408)"
                          value={editForm.mobileImageUrl || ""}
                          onChange={(val) => setEditForm({ ...editForm, mobileImageUrl: val })}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">代替テキスト (Alt)</label>
                          <input
                            type="text"
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500/20"
                            value={editForm.altText || ""}
                            onChange={(e) => setEditForm({ ...editForm, altText: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">表示順</label>
                          <input
                            type="number"
                            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500/20"
                            value={editForm.sortOrder || 0}
                            onChange={(e) => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          onClick={handleCancel}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="inline-flex items-center gap-2 rounded-lg bg-[#c2185b] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#a8154d] disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{banner.altText || "名称未設定バナー"}</h3>
                            {banner.isActive ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                有効
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-400">無効</span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500 truncate max-w-md">{banner.imageUrl}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(banner.id, banner.isActive)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                              banner.isActive
                                ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            {banner.isActive ? "非表示にする" : "表示する"}
                          </button>
                          <button
                            onClick={() => handleEdit(banner)}
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(banner.id)}
                            className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-4 border-t border-gray-50 pt-4">
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">表示順</span>
                          <span className="text-sm font-medium text-gray-900">{banner.sortOrder}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">リンク先</span>
                          <span className="text-sm font-medium text-gray-900">{banner.linkUrl || "なし"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {editingId === 'new' && (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">新規バナー追加</h3>
            <div className="space-y-4">
              <div className="mb-4 space-y-4">
                <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                  <p className="text-sm text-amber-800 font-bold mb-2">【重要】アップロードする画像の比率について</p>
                  <ul className="text-xs text-amber-700 list-disc pl-4 space-y-1">
                    <li><strong>PC用画像:</strong> アスペクト比 1840：564 でアップロードしてください。</li>
                    <li><strong>スマホ用画像:</strong> アスペクト比 3022：1408 でアップロードしてください。</li>
                    <li>比率が異なる画像は保存できません。</li>
                  </ul>
                </div>
                <ImageUploadInput
                  label="PC用画像URL (1840:564)"
                  value={editForm.imageUrl || ""}
                  onChange={(val) => setEditForm({ ...editForm, imageUrl: val })}
                />
                <ImageUploadInput
                  label="スマホ用画像URL (3022:1408)"
                  value={editForm.mobileImageUrl || ""}
                  onChange={(val) => setEditForm({ ...editForm, mobileImageUrl: val })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">代替テキスト (Alt)</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500/20"
                    value={editForm.altText || ""}
                    onChange={(e) => setEditForm({ ...editForm, altText: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">表示順</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-500/20"
                    value={editForm.sortOrder || 0}
                    onChange={(e) => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#c2185b] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#a8154d] disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={!!deleteId}
        title="バナーの削除"
        message="このバナーを削除します。よろしいですか？"
        confirmText="削除する"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isDestructive={true}
      />
    </div>
  );
}
