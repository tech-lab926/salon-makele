"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface SlideData {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
}

const defaultSlides: SlideData[] = [
  {
    id: "slide-1",
    imageUrl: "/demo/banners/hero_banner_with_text.png",
    title: "MAKELE Premium Art Makeup",
  },
  {
    id: "slide-2",
    imageUrl: "/demo/banners/hero_banner_with_text.png",
    title: "Lip Art Makeup Campaign",
  },
  {
    id: "slide-3",
    imageUrl: "/demo/banners/hero_banner_with_text.png",
    title: "Premium Medical Beauty Platform",
  }
];

export default function HeroSlider({ 
  children, 
  slides = defaultSlides 
}: { 
  children?: React.ReactNode; 
  slides?: SlideData[]; 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  if (!slides || slides.length === 0) return <>{children}</>;

  return (
    <div className="relative overflow-hidden w-full h-[22rem] sm:h-[28rem] lg:h-[34rem] flex flex-col items-center justify-center bg-gray-50">
      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        <div 
          className="flex h-full w-full transition-transform duration-1000 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div key={slide.id} className="relative h-full w-full shrink-0">
              <Image
                src={slide.imageUrl}
                alt={slide.title || `Hero Slide ${idx + 1}`}
                fill
                className="object-cover object-center"
                priority={idx === 0}
                loading={idx === 0 ? undefined : "lazy"}
               unoptimized={true} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Overlay Content */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
        {children}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/40 p-2 text-white backdrop-blur-md transition-all hover:bg-white/60 shadow-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8 text-black/50" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/40 p-2 text-white backdrop-blur-md transition-all hover:bg-white/60 shadow-sm"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8 text-black/50" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full shadow-sm transition-all focus:outline-none ${
              idx === currentIndex ? "w-8 bg-[#c2185b]" : "w-2.5 bg-white/80 hover:bg-[#c2185b]/60"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
