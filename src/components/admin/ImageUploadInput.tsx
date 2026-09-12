"use client";

import { useState, useRef } from "react";
import { Loader2, UploadCloud, Link as LinkIcon, Image as ImageIcon, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

interface ImageUploadInputProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export default function ImageUploadInput({
  label,
  value,
  onChange,
  className = "",
  placeholder = "https://...",
  required = false,
}: ImageUploadInputProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("ファイルサイズが大きすぎます。10MB以下の画像を選択してください。");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') || file.type === 'image/heic';
    if (isHeic) {
      toast.error("iPhoneの高画質フォーマット(HEIC)は現在対応していません。設定から「互換性優先」に変更するか、スクリーンショットをアップロードしてください。");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error("ファイルサイズが大きすぎます。10MB以下の画像を選択してください。");
        }
        
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
        toast.success("画像をアップロードしました");
      } else {
        throw new Error(data.error || "アップロードに失敗しました");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "アップロードに失敗しました");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LinkIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="block w-full pl-9 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]"
          />
        </div>
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors disabled:opacity-50 border border-gray-200"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          {uploading ? "アップロード中..." : "画像を選択"}
        </button>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          ref={fileInputRef}
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {value && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block overflow-hidden rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors w-32 h-32 relative flex flex-col items-center justify-center group"
        >
          <img
            src={`${value}${value.includes("?") ? "&" : "?"}t=${Date.now()}`}
            alt="Preview"
            className="w-full h-full object-contain"
            onError={(e) => {
              // If the image fails to load (e.g. file system sync delay), retry up to 3 times
              const target = e.target as HTMLImageElement;
              const currentRetry = parseInt(target.getAttribute("data-retry") || "0", 10);
              if (currentRetry < 3) {
                setTimeout(() => {
                  target.setAttribute("data-retry", (currentRetry + 1).toString());
                  target.src = `${value}${value.includes("?") ? "&" : "?"}retry=${currentRetry + 1}&t=${Date.now()}`;
                }, 500);
              }
            }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
            <ExternalLink className="w-5 h-5 text-white mb-1" />
            <span className="text-[10px] font-medium text-white">別タブで開く</span>
          </div>
        </a>
      )}
    </div>
  );
}
