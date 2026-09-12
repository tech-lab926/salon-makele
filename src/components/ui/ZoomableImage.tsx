"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ExternalLink } from "lucide-react";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}

export default function ZoomableImage({ src, alt, className, sizes }: ZoomableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div 
        className="relative w-full cursor-zoom-in overflow-hidden group"
        onClick={() => setIsOpen(true)}
      >
        <Image
          src={src}
          alt={alt}
          width={0}
          height={0}
          sizes={sizes || "100vw"}
          style={{ width: '100%', height: 'auto' }}
          className={`transition-transform duration-300 group-hover:scale-105 ${className || ''}`}
          unoptimized={true}
        />
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-4">
            <a 
              href={src} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">新しいタブで開く</span>
            </a>
            <button 
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div 
            className="relative h-full max-h-[90vh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              unoptimized={true}
            />
          </div>
        </div>
      )}
    </>
  );
}
