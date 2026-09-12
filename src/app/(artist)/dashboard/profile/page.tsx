"use client";

import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import ImageUpload from "@/components/ui/ImageUpload";

interface ProfileData {
  displayName: string;
  bio: string;
  clinicName: string;
  clinicAddress: string;
  businessHours: string;
  instagramUrl: string;
  twitterUrl: string;
  lineUrl: string;
  yearsOfExperience: number | "";
  areaId: string;
  profileImgUrl: string;
  skills: string[];
  areas: { id: string; prefecture: string }[];
  categories: { id: string; name: string }[];
  medicalLicenseUrl: string;
  artmakeDiplomaUrl: string;
  registrationStatus: string;
}

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
        <div className="flex flex-col items-center p-2">
          <span className="text-4xl">📄</span>
          <span className="text-xs text-gray-500 text-center px-2 break-all w-full mt-2 line-clamp-3">{fileName}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
        <span className="text-[10px] font-medium text-white mt-1">別タブで開く</span>
      </div>
    </a>
  );
}

export default function ProfileEditPage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/artist/profile")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData({
            displayName: res.data.displayName,
            bio: res.data.bio || "",
            clinicName: res.data.clinicName || "",
            clinicAddress: res.data.clinicAddress || "",
            businessHours: res.data.businessHours || "",
            instagramUrl: res.data.instagramUrl || "",
            twitterUrl: res.data.twitterUrl || "",
            lineUrl: res.data.lineUrl || "",
            yearsOfExperience: res.data.yearsOfExperience || "",
            areaId: res.data.areaId,
            profileImgUrl: res.data.profileImgUrl || "",
            medicalLicenseUrl: res.data.medicalLicenseUrl || "",
            artmakeDiplomaUrl: res.data.artmakeDiplomaUrl || "",
            registrationStatus: res.data.registrationStatus || "PROVISIONAL",
            skills: res.data.skills,
            areas: res.data.areas,
            categories: res.data.categories,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/artist/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: data.displayName,
          bio: data.bio,
          clinicName: data.clinicName || null,
          clinicAddress: data.clinicAddress || null,
          businessHours: data.businessHours || null,
          instagramUrl: data.instagramUrl || null,
          twitterUrl: data.twitterUrl || null,
          lineUrl: data.lineUrl || null,
          yearsOfExperience: data.yearsOfExperience === "" ? null : Number(data.yearsOfExperience),
          areaId: data.areaId,
          profileImgUrl: data.profileImgUrl,
          skills: data.skills,
        }),
      });
      const result = await res.json();
      setMessage(result.success ? "保存しました" : result.error || "保存に失敗しました");
    } catch {
      setMessage("エラーが発生しました");
    } finally {
      setSaving(false);
    }
  }

  function toggleSkill(categoryId: string) {
    if (!data) return;
    setData({
      ...data,
      skills: data.skills.includes(categoryId)
        ? data.skills.filter((s) => s !== categoryId)
        : [...data.skills, categoryId],
    });
  }

  if (loading || !data) {
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
      <h1 className="text-2xl font-bold text-gray-900">プロフィール編集</h1>

      {message && (
        <div
          className={`mt-4 rounded-lg p-3 text-sm ${
            message === "保存しました"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mt-6 space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <ImageUpload
          label="プロフィール画像"
          value={data.profileImgUrl}
          onChange={(url) => setData({ ...data, profileImgUrl: url })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg bg-pink-50 p-4 border border-pink-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              医師免許・看護師免許
            </label>
            {data.medicalLicenseUrl ? (
              <DocumentPreview url={data.medicalLicenseUrl} />
            ) : (
              <p className="text-sm text-gray-500">未提出</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              アートメイクディプロマ
            </label>
            {data.artmakeDiplomaUrl ? (
              <DocumentPreview url={data.artmakeDiplomaUrl} />
            ) : (
              <p className="text-sm text-gray-500">未提出</p>
            )}
          </div>
          <div className="col-span-1 sm:col-span-2 pt-2 border-t border-pink-200 mt-2">
            <label className="block text-sm font-medium text-gray-700">審査ステータス</label>
            <div className={`mt-1.5 p-2 rounded-lg text-sm border bg-white max-w-max px-4 ${
              data.registrationStatus === "APPROVED" ? "border-green-200 text-green-700" :
              data.registrationStatus === "REJECTED" ? "border-red-200 text-red-700" :
              "border-yellow-200 text-yellow-700"
            }`}>
              {data.registrationStatus === "APPROVED" ? "承認済 (APPROVED)" :
               data.registrationStatus === "REJECTED" ? "却下 (REJECTED)" :
               "仮登録 (PROVISIONAL) - 審査中"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ※これらの情報は編集できません。
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            表示名
          </label>
          <input
            type="text"
            value={data.displayName}
            onChange={(e) => setData({ ...data, displayName: e.target.value })}
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            自己紹介
          </label>
          <textarea
            rows={5}
            value={data.bio}
            onChange={(e) => setData({ ...data, bio: e.target.value })}
            placeholder="経歴や得意な施術について記入してください"
            className={`mt-1.5 ${inputClass}`}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              在籍クリニック名
            </label>
            <input
              type="text"
              value={data.clinicName}
              onChange={(e) => setData({ ...data, clinicName: e.target.value })}
              placeholder="例: 銀座アートメイククリニック（銀座院）"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              クリニック住所
            </label>
            <input
              type="text"
              value={data.clinicAddress}
              onChange={(e) => setData({ ...data, clinicAddress: e.target.value })}
              placeholder="例: 東京都中央区銀座..."
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              営業時間
            </label>
            <input
              type="text"
              value={data.businessHours}
              onChange={(e) => setData({ ...data, businessHours: e.target.value })}
              placeholder="例: 10:00〜19:00"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              経験年数 (年)
            </label>
            <input
              type="number"
              min="0"
              value={data.yearsOfExperience}
              onChange={(e) => setData({ ...data, yearsOfExperience: e.target.value ? Number(e.target.value) : "" })}
              placeholder="例: 6"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Instagram URL
            </label>
            <input
              type="url"
              value={data.instagramUrl}
              onChange={(e) => setData({ ...data, instagramUrl: e.target.value })}
              placeholder="https://instagram.com/..."
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              X (Twitter) URL
            </label>
            <input
              type="url"
              value={data.twitterUrl}
              onChange={(e) => setData({ ...data, twitterUrl: e.target.value })}
              placeholder="https://x.com/..."
              className={`mt-1.5 ${inputClass}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              LINE URL
            </label>
            <input
              type="url"
              value={data.lineUrl}
              onChange={(e) => setData({ ...data, lineUrl: e.target.value })}
              placeholder="https://line.me/..."
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            エリア
          </label>
          <select
            value={data.areaId}
            onChange={(e) => setData({ ...data, areaId: e.target.value })}
            className={`mt-1.5 ${inputClass}`}
          >
            {data.areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.prefecture}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            対応カテゴリ
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleSkill(c.id)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  data.skills.includes(c.id)
                    ? "border-[#c2185b] bg-pink-50 text-[#c2185b]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#c2185b] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#880e4f] disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
