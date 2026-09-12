"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon, ExternalLink } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
  label: string;
  required?: boolean;
}

export default function ImageUpload({ value, onChange, label, required }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If the image came from Google Photos Picker (saved in /uploads/), clean it up on the server
  async function handleRemove() {
    if (value && value.startsWith("/uploads/")) {
      const filename = value.split("/uploads/")[1];
      // Fire and forget — don't block the UI
      fetch(`/api/artist/photos/picker?file=${encodeURIComponent(filename)}`, { method: "DELETE" }).catch(() => {});
    }
    onChange("");
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      // 1. Client-side File Size Check (Max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("ファイルサイズが大きすぎます。5MB以下の画像を選択してください。");
      }

      // 2. Client-side Format Check (HEIC)
      const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') || file.type === 'image/heic';
      if (isHeic) {
        throw new Error("iPhoneの高画質フォーマット(HEIC)は現在対応していません。設定から「互換性優先」に変更して再度撮影するか、写真のスクリーンショットをアップロードしてください。");
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error("ファイルサイズが大きすぎます。5MB以下の画像を選択してください。");
        }
        
        // Try to parse JSON error if available
        let errData;
        try {
          errData = await res.json();
        } catch {
          throw new Error(`サーバーエラーが発生しました (Status: ${res.status})`);
        }
        throw new Error(errData?.error || "アップロードに失敗しました");
      }

      const data = await res.json();
      if (data.success) {
        onChange(data.data.url);
      } else {
        throw new Error(data.error || "アップロードに失敗しました");
      }
    } catch (err: any) {
      setError(err.message || "アップロードに失敗しました");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1.5">
        {value ? (
          <div className="relative mb-3 inline-block">
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="relative h-32 w-32 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center group hover:bg-gray-100 transition-colors block"
            >
              <Image src={value} alt="" fill className="object-cover" sizes="128px" unoptimized={true} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity z-10">
                <ExternalLink className="w-5 h-5 text-white mb-1" />
                <span className="text-[10px] font-medium text-white">別タブで開く</span>
              </div>
            </a>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-2 -top-2 rounded-full bg-white p-1 shadow-md ring-1 ring-gray-200 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400 transition-colors hover:border-[#c2185b] hover:text-[#c2185b] disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-6 w-6" />
                <span className="text-xs">画像を選択</span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="mt-2 flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "アップロード中..." : "変更"}
            </button>
          )}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="またはURLを直接入力"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
          />
        </div>

        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
