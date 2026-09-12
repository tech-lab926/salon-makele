"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  techniques: { id: string; name: string }[];
  caseCount: number;
  artistCount: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("0");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSortOrder, setEditSortOrder] = useState("0");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (data.success) setCategories(data.data);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newName, 
          slug: newSlug,
          sortOrder: parseInt(newSortOrder) || 0
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setNewName("");
        setNewSlug("");
        setNewSortOrder("0");
        fetchCategories();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function startEdit(category: AdminCategory) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditSlug(category.slug);
    setEditIsActive(category.isActive);
    setEditSortOrder((category.sortOrder ?? 0).toString());
  }

  async function handleUpdate(categoryId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          slug: editSlug,
          isActive: editIsActive,
          sortOrder: parseInt(editSortOrder) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        fetchCategories();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(categoryId: string) {
    if (!window.confirm("このカテゴリを削除しますか？")) return;

    setDeletingId(categoryId);
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
      } else if (data.error) {
        window.alert(data.error);
      }
    } catch {
      window.alert("カテゴリの削除に失敗しました");
    } finally {
      setDeletingId(null);
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
    "block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]";

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">カテゴリ管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            施術カテゴリの管理
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-[#c2185b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#880e4f]"
        >
          <Plus className="h-4 w-4" />
          新規追加
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 flex items-end gap-4 rounded-xl border border-pink-100 bg-pink-50/50 p-5"
        >
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              カテゴリ名
            </label>
            <input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例：ヘアライン"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div className="flex-[2]">
            <label className="block text-sm font-medium text-gray-700">
              スラッグ
            </label>
            <input
              required
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="例：hairline"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              表示順
            </label>
            <input
              type="number"
              value={newSortOrder}
              onChange={(e) => setNewSortOrder(e.target.value)}
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="shrink-0 rounded-lg bg-[#c2185b] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#880e4f] disabled:opacity-50"
          >
            {saving ? "追加中..." : "追加"}
          </button>
        </form>
      )}

      <div className="mt-6 space-y-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                {editingId === cat.id ? (
                  <div className="space-y-3">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                      className={inputClass}
                      placeholder="スラッグ"
                    />
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-gray-400">表示順</label>
                        <input
                          type="number"
                          value={editSortOrder}
                          onChange={(e) => setEditSortOrder(e.target.value)}
                          className={`mt-0.5 ${inputClass}`}
                        />
                      </div>
                      <label className="flex flex-1 items-center gap-2 pt-5 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={editIsActive}
                          onChange={(e) => setEditIsActive(e.target.checked)}
                        />
                        公開カテゴリとして有効化
                      </label>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {cat.name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          cat.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {cat.isActive ? "有効" : "無効"}
                      </span>
                      <span className="text-xs font-bold text-gray-300">
                        #{cat.sortOrder}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-400">/{cat.slug}</p>
                  </>
                )}
              </div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>症例 {cat.caseCount}件</span>
                <span>アーティスト {cat.artistCount}人</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {editingId === cat.id ? (
                <>
                  <button
                    onClick={() => handleUpdate(cat.id)}
                    disabled={saving}
                    className="rounded-lg bg-[#c2185b] px-4 py-2 text-sm font-medium text-white hover:bg-[#880e4f] disabled:opacity-50"
                  >
                    {saving ? "保存中..." : "保存"}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(cat)}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={deletingId === cat.id}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === cat.id ? "削除中..." : "削除"}
                  </button>
                </>
              )}
            </div>
            {cat.techniques.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {cat.techniques.map((t) => (
                  <span
                    key={t.id}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
