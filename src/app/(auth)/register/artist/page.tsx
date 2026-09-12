"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Eye, EyeOff, X, FileText, ExternalLink } from "lucide-react";

interface AreaRow {
  id: string;
  prefecture: string;
}

interface CategoryRow {
  id: string;
  name: string;
}

function FilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return null;

  const isImage = file.type.startsWith("image/");

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="mt-3 block overflow-hidden rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors w-32 h-32 relative flex flex-col items-center justify-center group"
    >
      {isImage ? (
        <img src={url} alt="Preview" className="w-full h-full object-cover" />
      ) : (
        <>
          <FileText className="w-8 h-8 text-gray-400 mb-2" />
          <span className="text-xs text-gray-500 text-center px-2 truncate w-full">{file.name}</span>
        </>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
        <ExternalLink className="w-5 h-5 text-white mb-1" />
        <span className="text-[10px] font-medium text-white">別タブで開く</span>
      </div>
    </a>
  );
}

export default function RegisterArtistPage() {
  const router = useRouter();
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [medicalLicenseFile, setMedicalLicenseFile] = useState<File | null>(null);
  const [artmakeDiplomaFile, setArtmakeDiplomaFile] = useState<File | null>(null);
  const medicalLicenseInputRef = useRef<HTMLInputElement>(null);
  const artmakeDiplomaInputRef = useRef<HTMLInputElement>(null);

  const clearMedicalLicense = () => {
    setMedicalLicenseFile(null);
    if (medicalLicenseInputRef.current) {
      medicalLicenseInputRef.current.value = "";
    }
  };

  const clearArtmakeDiploma = () => {
    setArtmakeDiplomaFile(null);
    if (artmakeDiplomaInputRef.current) {
      artmakeDiplomaInputRef.current.value = "";
    }
  };

  const [form, setForm] = useState({
    name: "",
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    areaId: "",
    bio: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    Promise.all([fetch("/api/areas"), fetch("/api/categories")])
      .then(([ar, cat]) => Promise.all([ar.json(), cat.json()]))
      .then(([areaData, catData]) => {
        if (areaData.success && Array.isArray(areaData.data)) {
          setAreas(
            areaData.data.map((a: { id: string; prefecture: string }) => ({
              id: a.id,
              prefecture: a.prefecture,
            })),
          );
        }
        if (catData.success && Array.isArray(catData.data)) {
          setCategories(
            catData.data.map((c: { id: string; name: string }) => ({
              id: c.id,
              name: c.name,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (form.password.length < 8) {
      setError("パスワードは8文字以上で入力してください");
      return;
    }

    if (!form.areaId) {
      setError("エリア（都道府県）を選択してください");
      return;
    }

    if (selectedCategoryIds.length === 0) {
      setError("施術カテゴリを1つ以上選択してください");
      return;
    }

    if (!medicalLicenseFile || !artmakeDiplomaFile) {
      setError("必要な資格証明書（免許およびディプロマ）をアップロードしてください");
      return;
    }

    setLoading(true);

    try {
      let medicalLicenseUrl = "";
      let artmakeDiplomaUrl = "";

      const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { 
          method: "POST", 
          body: formData,
          headers: {
            "x-registration-upload": "true"
          }
        });

        if (res.status === 413) {
          throw new Error("ファイルサイズが大きすぎます。10MB以下の画像を選択してください。");
        }

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error("サーバーエラーが発生しました。ファイルサイズや形式を確認してください。");
        }

        const data = await res.json();
        if (!data.success) throw new Error(data.error || "アップロードに失敗しました");
        return data.data.url;
      };

      try {
        medicalLicenseUrl = await uploadFile(medicalLicenseFile);
        artmakeDiplomaUrl = await uploadFile(artmakeDiplomaFile);
      } catch (e: any) {
        setError(e.message);
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: "artist",
          areaId: form.areaId,
          categoryIds: selectedCategoryIds,
          medicalLicenseUrl,
          artmakeDiplomaUrl,
          displayName: form.displayName.trim() || undefined,
          bio: form.bio.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "登録に失敗しました");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-[#c2185b]">
            MAKELE
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            アーティスト登録
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            アートメイクアーティストとして登録します。必要書類をアップロードしていただき、運営の審査を通過した後に本登録完了となります。
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Googleアカウントの連携やGoogleフォトからの画像選びは、登録後にログイン画面の「Googleで続ける」から行えます。
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                お名前（本名） <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
                placeholder="山田 太郎"
              />
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                表示名（活動名・省略可）
              </label>
              <input
                id="displayName"
                type="text"
                value={form.displayName}
                onChange={(e) => updateField("displayName", e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
                placeholder="未入力の場合はお名前と同じになります"
              />
            </div>

            <div>
              <label htmlFor="areaId" className="block text-sm font-medium text-gray-700">
                主な活動エリア <span className="text-red-500">*</span>
              </label>
              <select
                id="areaId"
                required
                value={form.areaId}
                onChange={(e) => updateField("areaId", e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
              >
                <option value="">選択してください</option>
                {areas.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.prefecture}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-700">
                対応施術カテゴリ <span className="text-red-500">*</span>
              </span>
              <p className="mt-1 text-xs text-gray-500">
                検索・掲載に表示される専門分野です（複数選択可）
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((c: any) => {
                  const on = selectedCategoryIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                        on
                          ? "border-[#c2185b] bg-pink-50 text-[#c2185b]"
                          : "border-gray-200 bg-white text-gray-600 hover:border-pink-200"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                自己紹介（任意）
              </label>
              <textarea
                id="bio"
                rows={3}
                value={form.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
                placeholder="後からプロフィール編集でも入力できます"
              />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">資格証明書のアップロード</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    医師免許・看護師免許 <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="file"
                      ref={medicalLicenseInputRef}
                      required={!medicalLicenseFile}
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => setMedicalLicenseFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                    />
                    {medicalLicenseFile && (
                      <button
                        type="button"
                        onClick={clearMedicalLicense}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                        title="ファイル選択を解除"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">画像、PDF、またはWordドキュメント形式</p>
                  {medicalLicenseFile && <FilePreview file={medicalLicenseFile} />}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    アートメイクスクール修了証（ディプロマ） <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="file"
                      ref={artmakeDiplomaInputRef}
                      required={!artmakeDiplomaFile}
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => setArtmakeDiplomaFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                    />
                    {artmakeDiplomaFile && (
                      <button
                        type="button"
                        onClick={clearArtmakeDiploma}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                        title="ファイル選択を解除"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">画像、PDF、またはWordドキュメント形式</p>
                  {artmakeDiplomaFile && <FilePreview file={artmakeDiplomaFile} />}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">アカウント情報</h3>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-12 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
                  placeholder="8文字以上で入力"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                パスワード確認 <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-12 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
                  placeholder="パスワードを再入力"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-[#c2185b] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#880e4f] disabled:opacity-50"
          >
            {loading ? "登録中..." : "アーティストとして登録"}
          </button>

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/register" className="font-medium text-[#c2185b] hover:underline">
              一般ユーザーとして登録する
            </Link>
            {" · "}
            <Link href="/login" className="font-medium text-[#c2185b] hover:underline">
              ログイン
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
