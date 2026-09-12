"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Edit2, Check, X } from "lucide-react";

interface Technique {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  sortOrder: number;
}

interface Category {
  id: string;
  name: string;
}

export default function AdminTechniquesPage() {
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("0");
  const [saving, setSaving] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [techRes, catRes] = await Promise.all([
      fetch("/api/admin/techniques"),
      fetch("/api/categories")
    ]);
    const techData = await techRes.json();
    const catData = await catRes.json();
    if (techData.success) setTechniques(techData.data);
    if (catData.success) setCategories(catData.data);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/techniques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newName, 
          categoryId: newCategoryId,
          sortOrder: parseInt(newSortOrder) || 0
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setNewName("");
        setNewCategoryId("");
        setNewSortOrder("0");
        fetchData();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/techniques", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editName,
          categoryId: editCategoryId,
          sortOrder: parseInt(editSortOrder) || 0
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        fetchData();
      }
    } finally {
      setSaving(false);
    }
  }

  function startEditing(t: Technique) {
    setEditingId(t.id);
    setEditName(t.name);
    setEditCategoryId(t.categoryId);
    setEditSortOrder(t.sortOrder.toString());
  }

  async function handleDelete(id: string) {
    if (!confirm("この技法を削除しますか？")) return;
    const res = await fetch(`/api/admin/techniques?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setTechniques((prev) => prev.filter((t) => t.id !== id));
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

  const editInputClass = 
    "block rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b] bg-white";

  const grouped = categories.map((cat) => ({
    ...cat,
    techniques: techniques.filter((t) => t.categoryId === cat.id),
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">技法管理</h1>
          <p className="mt-1 text-sm text-gray-500">施術技法の追加・編集・削除</p>
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
          <div className="flex-[2]">
            <label className="block text-sm font-medium text-gray-700">カテゴリ</label>
            <select
              required
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              className={`mt-1 ${inputClass}`}
            >
              <option value="">選択してください</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-[2]">
            <label className="block text-sm font-medium text-gray-700">技法名</label>
            <input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例：マイクロブレーディング"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">表示順</label>
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

      <div className="mt-6 space-y-6">
        {grouped.map((cat) => (
          <div key={cat.id} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">{cat.name}</h3>
            {cat.techniques.length === 0 ? (
              <p className="mt-3 text-sm text-gray-400">技法がまだ登録されていません</p>
            ) : (
              <div className="mt-3 space-y-2">
                {cat.techniques.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-300">#{t.sortOrder}</span>
                      {editingId === t.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className={editInputClass}
                            autoFocus
                          />
                          <select
                            value={editCategoryId}
                            onChange={(e) => setEditCategoryId(e.target.value)}
                            className={editInputClass}
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            value={editSortOrder}
                            onChange={(e) => setEditSortOrder(e.target.value)}
                            className={`${editInputClass} w-16`}
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-gray-700">{t.name}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {editingId === t.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate(t.id)}
                            disabled={saving}
                            className="rounded p-1 text-green-600 hover:bg-green-50"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(t)}
                            className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
