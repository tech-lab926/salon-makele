"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

interface Photo {
  id: string;
  title: string;
  beforeImgUrl: string;
  afterImgUrl: string;
  categoryName: string;
  techniqueName: string | null;
}

interface Props {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoLightbox({ photos, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [showAfter, setShowAfter] = useState(false);

  const photo = photos[index];

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : photos.length - 1));
    setShowAfter(false);
  }, [photos.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i < photos.length - 1 ? i + 1 : 0));
    setShowAfter(false);
  }, [photos.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goPrev, goNext]);

  if (!photo) return null;

  const imgUrl = showAfter ? photo.afterImgUrl : photo.beforeImgUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20"
        aria-label="閉じる"
      >
        <X className="h-6 w-6" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20"
            aria-label="前の写真"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20 top-1/2 -translate-y-1/2"
            aria-label="次の写真"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <button
            onClick={goPrev}
            className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20 top-1/2 -translate-y-1/2"
            aria-label="前の写真"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        </>
      )}

      <div className="flex max-h-[85vh] max-w-4xl flex-col items-center gap-4 px-16">
        <div className="relative aspect-square w-full max-w-lg overflow-hidden rounded-xl bg-gray-900">
          {imgUrl ? (
            <Image
              src={imgUrl}
              alt={`${photo.title} ${showAfter ? "施術後" : "施術前"}`}
              fill
              className="object-contain"
              sizes="(min-width: 1024px) 512px, 90vw"
              priority
             unoptimized={true} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-12 w-12 text-gray-600" />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAfter(false)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !showAfter
                ? "bg-white text-gray-900"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            Before
          </button>
          <button
            onClick={() => setShowAfter(true)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              showAfter
                ? "bg-[#c2185b] text-white"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            After
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-white">{photo.title}</p>
          <p className="mt-1 text-xs text-gray-400">
            {photo.categoryName}
            {photo.techniqueName && ` / ${photo.techniqueName}`}
            {" · "}
            {index + 1} / {photos.length}
          </p>
        </div>
      </div>
    </div>
  );
}
