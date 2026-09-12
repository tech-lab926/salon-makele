"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Clock, Loader2 } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  durationMin: number;
  isActive: boolean;
  categoryId: string;
  categoryName: string;
}

interface Category {
  id: string;
  name: string;
}

function formatYen(price: number | null): string {
  if (price === null) return "要相談";
  return `¥${price.toLocaleString("ja-JP")}`;
}

export default function MenusPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [skillCategoryIds, setSkillCategoryIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    durationMin: "60",
    categoryId: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/artist/menus").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/artist/profile").then((r) => r.json()),
    ])
      .then(([menusData, catData, profileData]) => {
        if (menusData.success) setMenus(menusData.data);
        if (catData.success)
          setCategories(
            catData.data.map((c: { id: string; name: string }) => ({
              id: c.id,
              name: c.name,
            })),
          );
        if (profileData.success && Array.isArray(profileData.data.skills)) {
          setSkillCategoryIds(new Set(profileData.data.skills as string[]));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const isEditing = !!editingMenu;
      const url = isEditing ? `/api/artist/menus/${editingMenu.id}` : "/api/artist/menus";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          price: form.price ? Number(form.price) : null,
          durationMin: Number(form.durationMin),
          categoryId: form.categoryId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setEditingMenu(null);
        setForm({ name: "", description: "", price: "", durationMin: "60", categoryId: "" });
        const refreshRes = await fetch("/api/artist/menus");
        const refreshData = await refreshRes.json();
        if (refreshData.success) setMenus(refreshData.data);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  function handleEditClick(menu: MenuItem) {
    setEditingMenu(menu);
    setForm({
      name: menu.name,
      description: menu.description || "",
      price: menu.price !== null ? menu.price.toString() : "",
      durationMin: menu.durationMin.toString(),
      categoryId: menu.categoryId,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingMenu(null);
    setForm({ name: "", description: "", price: "", durationMin: "60", categoryId: "" });
  }

  function handleAddNewClick() {
    if (showForm && !editingMenu) {
      setShowForm(false);
    } else {
      setEditingMenu(null);
      setForm({ name: "", description: "", price: "", durationMin: "60", categoryId: "" });
      setShowForm(true);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("このメニューを削除しますか？")) return;
    const res = await fetch(`/api/artist/menus/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setMenus((prev) => prev.filter((m) => m.id !== id));
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/artist/menus/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setMenus((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !isActive } : m)),
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">メニュー管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            {menus.length}件のメニュー
          </p>
        </div>
        <button
          onClick={handleAddNewClick}
          className="flex items-center gap-2 rounded-lg bg-[#c2185b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#880e4f]"
        >
          <Plus className="h-4 w-4" />
          新規追加
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-xl border border-pink-100 bg-pink-50/50 p-5"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {editingMenu ? "メニューを編集" : "新しいメニューを追加"}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                メニュー名 *
              </label>
              <input
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="例：ナチュラル毛並み眉"
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                カテゴリ *
              </label>
              <select
                required
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
                className={`mt-1 ${inputClass}`}
              >
                <option value="">選択</option>
                {categories.filter((c) => skillCategoryIds.size === 0 || skillCategoryIds.has(c.id)).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                料金（円）
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value })
                }
                placeholder="空欄 = 要相談"
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                施術時間（分）
              </label>
              <input
                type="number"
                required
                value={form.durationMin}
                onChange={(e) =>
                  setForm({ ...form, durationMin: e.target.value })
                }
                className={`mt-1 ${inputClass}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              説明
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancelForm}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#c2185b] px-5 py-2 text-sm font-medium text-white hover:bg-[#880e4f] disabled:opacity-50"
            >
              {saving ? "保存中..." : editingMenu ? "更新する" : "追加する"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {menus.map((menu) => (
          <div
            key={menu.id}
            className={`rounded-xl border bg-white p-5 shadow-sm ${
              menu.isActive ? "border-gray-100" : "border-gray-100 opacity-60"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-pink-50 px-2.5 py-0.5 text-xs font-medium text-[#c2185b]">
                    {menu.categoryName}
                  </span>
                  {!menu.isActive && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
                      無効
                    </span>
                  )}
                </div>
                <h3 className="mt-1.5 font-semibold text-gray-900">
                  {menu.name}
                </h3>
                {menu.description && (
                  <p className="mt-1 text-sm text-gray-500 max-w-xl">
                    {menu.description}
                  </p>
                )}
                <p className="mt-1.5 flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  {menu.durationMin}分
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end sm:justify-start gap-2 sm:gap-4 mt-2 sm:mt-0 w-full sm:w-auto">
                <span className="text-lg font-bold text-[#c2185b]">
                  {formatYen(menu.price)}
                </span>
                <button
                  onClick={() => toggleActive(menu.id, menu.isActive)}
                  className="whitespace-nowrap min-w-[90px] rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 text-center"
                >
                  {menu.isActive ? "無効にする" : "有効にする"}
                </button>
                <button
                  onClick={() => handleEditClick(menu)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(menu.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
