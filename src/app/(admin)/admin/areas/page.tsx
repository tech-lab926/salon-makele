"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, MapPin, Edit2, Check, X } from "lucide-react";

interface Area {
  id: string;
  prefecture: string;
  city: string | null;
  sortOrder: number;
  artistCount: number;
}

export default function AdminAreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newPrefecture, setNewPrefecture] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("0");
  const [saving, setSaving] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrefecture, setEditPrefecture] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");

  useEffect(() => {
    fetchAreas();
  }, []);

  async function fetchAreas() {
    const res = await fetch("/api/admin/areas");
    const data = await res.json();
    if (data.success) setAreas(data.data);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prefecture: newPrefecture, 
          city: newCity || null,
          sortOrder: parseInt(newSortOrder) || 0
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setNewPrefecture("");
        setNewCity("");
        setNewSortOrder("0");
        fetchAreas();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editPrefecture.trim()) {
      alert("都道府県を入力してください");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/areas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id, 
          prefecture: editPrefecture, 
          city: editCity || null,
          sortOrder: parseInt(editSortOrder) || 0
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingId(null);
        fetchAreas();
      } else {
        alert(data.error || "更新に失敗しました");
      }
    } finally {
      setSaving(false);
    }
  }

  function startEditing(a: Area) {
    setEditingId(a.id);
    setEditPrefecture(a.prefecture);
    setEditCity(a.city || "");
    setEditSortOrder(a.sortOrder.toString());
  }

  async function handleDelete(id: string) {
    if (!confirm("このエリアを削除しますか？")) return;
    const res = await fetch(`/api/admin/areas?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setAreas((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert(data.error || "削除に失敗しました");
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

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">エリア管理</h1>
          <p className="mt-1 text-sm text-gray-500">都道府県・エリアの管理</p>
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
            <label className="block text-sm font-medium text-gray-700">都道府県</label>
            <input
              required
              value={newPrefecture}
              onChange={(e) => setNewPrefecture(e.target.value)}
              placeholder="例：大阪府"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div className="flex-[2]">
            <label className="block text-sm font-medium text-gray-700">市区町村（任意）</label>
            <input
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              placeholder="例：梅田"
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

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">エリア</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">表示順</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">アーティスト数</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {areas.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {editingId === a.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editPrefecture}
                          onChange={(e) => setEditPrefecture(e.target.value)}
                          className={editInputClass}
                          placeholder="都道府県"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className={editInputClass}
                          placeholder="市区町村"
                        />
                      </div>
                    ) : (
                      <span className="font-medium text-gray-900">
                        {a.prefecture}{a.city ? ` ${a.city}` : ""}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {editingId === a.id ? (
                    <input
                      type="number"
                      value={editSortOrder}
                      onChange={(e) => setEditSortOrder(e.target.value)}
                      className={`${editInputClass} w-16 mx-auto text-center`}
                    />
                  ) : (
                    <span className="text-gray-600">{a.sortOrder}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-gray-600">{a.artistCount}人</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {editingId === a.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(a.id)}
                          disabled={saving}
                          className="rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 disabled:opacity-30"
                          title="保存"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
                          title="キャンセル"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(a)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                          title="編集"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={a.artistCount > 0}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                          title={a.artistCount > 0 ? "アーティストが紐付いているため削除不可" : "削除"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
