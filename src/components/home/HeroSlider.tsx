"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getOptimizedMediaUrl } from "@/lib/utils";

interface HeroBanner {
  id: string;
  imageUrl: string;
  mobileImageUrl: string;
  altText: string | null;
  linkUrl: string | null;
}

interface HeroSliderProps {
  banners: readonly HeroBanner[];
}

export default function HeroSlider({ banners }: HeroSliderProps) {
  const originalBanners = banners.length > 0 
    ? (banners.length === 1 ? [banners[0], banners[0], banners[0]] : banners)
    : [
        { id: "fallback-1", imageUrl: "/demo/banners/hero_banner_with_text.png", mobileImageUrl: "/demo/banners/a.png", altText: "MAKELE Hero Banner 1", linkUrl: null },
        { id: "fallback-2", imageUrl: "/demo/banners/hero_banner_with_text.png", mobileImageUrl: "/demo/banners/a.png", altText: "MAKELE Hero Banner 2", linkUrl: null },
        { id: "fallback-3", imageUrl: "/demo/banners/hero_banner_with_text.png", mobileImageUrl: "/demo/banners/a.png", altText: "MAKELE Hero Banner 3", linkUrl: null },
      ];

  const totalOriginal = originalBanners.length;
  
  // Infinite loop array: [Last, Slide 1, Slide 2, ..., Last, Slide 1]
  const displayBanners = [
    originalBanners[totalOriginal - 1],
    ...originalBanners,
    originalBanners[0]
  ];

  const totalCount = displayBanners.length;
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => prev + 1);
    setIsTransitioning(true);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => prev - 1);
    setIsTransitioning(true);
  }, []);

  // Jump logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentSlide === totalCount - 1) {
      timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(1);
      }, 700);
    } else if (currentSlide === 0) {
      timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(totalCount - 2);
      }, 700);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [currentSlide, totalCount]);

  // Autoplay
  useEffect(() => {
    if (totalOriginal <= 1) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [handleNext, totalOriginal, currentSlide]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) handleNext();
    if (distance < -minSwipeDistance) handlePrev();
  };

  if (totalOriginal === 0) return null;

  return (
    <div 
      className="relative group w-full h-full overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* 
        Fixed sizing: 
        1. Container width is totalCount * 100% of its parent.
        2. Each slide is exactly (1/totalCount) of the container.
        3. Translation is done in percentages of the container's own width.
      */}
      <div 
        className={`flex h-full ${isTransitioning ? "transition-transform duration-700 ease-in-out" : ""}`}
        style={{ 
          width: `${totalCount * 100}%`,
          transform: `translateX(-${(currentSlide * 100) / totalCount}%)` 
        }}
      >
        {displayBanners.map((banner, index) => {
          const isDefaultBanner = banner.imageUrl === "/demo/banners/hero_banner_with_text.png";
          const mobileImg = banner.mobileImageUrl || (isDefaultBanner ? "/demo/banners/a.png" : banner.imageUrl);

          return (
            <div 
              key={`${banner.id}-${index}`} 
              style={{ width: `${100 / totalCount}%` }}
              className="relative h-full"
            >
              <Image
                src={getOptimizedMediaUrl(banner.imageUrl)}
                alt={banner.altText || "MAKELE Hero Banner Desktop"}
                fill
                priority={index === 1}
                className="hidden sm:block object-contain"
                sizes="100vw"
              />
              <Image
                src={getOptimizedMediaUrl(mobileImg)}
                alt={banner.altText || "MAKELE Hero Banner Mobile"}
                fill
                priority={index === 1}
                className="block sm:hidden object-contain"
                sizes="100vw"
              />
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 items-center justify-center rounded-full bg-white/40 text-black backdrop-blur-md transition-all hover:bg-white/60 hover:scale-110 shadow-lg"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={handleNext}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 h-10 w-10 items-center justify-center rounded-full bg-white/40 text-black backdrop-blur-md transition-all hover:bg-white/60 hover:scale-110 shadow-lg"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Slide Indicators — overlaid on image; lifted higher on mobile where object-contain leaves a gap */}
      <div className="absolute bottom-[22%] sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2.5">
        {originalBanners.map((_, index) => {
          let activeIndex = currentSlide;
          if (currentSlide === 0) activeIndex = totalOriginal;
          if (currentSlide === totalCount - 1) activeIndex = 1;
          
          return (
            <button
              key={index}
              onClick={() => {
                setCurrentSlide(index + 1);
                setIsTransitioning(true);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === index + 1 
                  ? "w-8 bg-[#c2185b] md:bg-white" 
                  : "w-2 bg-[#c2185b]/30 md:bg-white/40"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
