"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight, ImageIcon } from "lucide-react";
import { getOptimizedMediaUrl } from "@/lib/utils";

interface Blog {
  id: string | bigint;
  title: string;
  slug: string;
  thumbnailUrl: string | null;
  excerpt?: string | null;
}

interface FeaturedArticlesProps {
  blogs: Blog[];
}

export default function FeaturedArticles({ blogs }: FeaturedArticlesProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280; // Approximating card width + gap
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!blogs || blogs.length === 0) return null;

  return (
    <section className="bg-gray-50 pt-8 sm:pt-10 lg:pt-12 pb-8 sm:pb-6 lg:pb-8">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
        <div className="mx-auto max-w-5xl max-lg:px-0 lg:px-8">
          <div className="border-b border-gray-200 pb-2 sm:pb-3">
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
              開催中の特集
            </h2>
          </div>
        </div>

        {/* Centered Carousel Block */}
        <div className="mt-4 flex items-center justify-start group/nav sm:mt-5 lg:justify-center">
          {/* Left Arrow */}
          <button
            onClick={() => scroll("left")}
            className="hidden xl:flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c2185b] text-white shadow-md transition-all hover:bg-[#880e4f] hover:scale-110 active:scale-95 mr-1"
            aria-label="Previous article"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="relative min-w-0 flex-1 lg:flex-none lg:w-fit lg:max-w-[1000px] lg:overflow-hidden">
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto pb-2 [touch-action:pan-x_pan-y] [scrollbar-width:none] snap-x snap-mandatory max-lg:pl-0 max-lg:pr-6 lg:px-4 sm:gap-6 max-lg:w-[calc(100%+1.5rem)] max-lg:-mr-6 [&::-webkit-scrollbar]:hidden"
            >
              {blogs.map((b) => (
                <Link
                  key={b.id.toString()}
                  href={`/blog/${b.slug}`}
                  className="group relative flex-none w-[80vw] max-w-[260px] sm:max-w-[300px] snap-center overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  {/* Image Area with 'Pasted' effect */}
                  <div className="p-2 pb-0">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-50">
                      {b.thumbnailUrl ? (
                        <Image
                          src={getOptimizedMediaUrl(b.thumbnailUrl)}
                          alt={b.title}
                          fill
                          className="object-contain transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 80vw, 300px"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gray-50">
                          <ImageIcon className="h-8 w-8 text-gray-200" />
                        </div>
                      )}
                    </div>
                  </div>

  
                  {/* Content Area */}
                  <div className="p-3 sm:p-4">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug min-h-[2.5rem] group-hover:text-[#c2185b] transition-colors">
                      {b.title}
                    </h3>
                    {b.excerpt && (
                      <p className="mt-1.5 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                        {b.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll("right")}
            className="hidden xl:flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c2185b] text-white shadow-md transition-all hover:bg-[#880e4f] hover:scale-110 active:scale-95 ml-1"
            aria-label="Next article"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>



        {/* Footer Link - Restricted to max-w-5xl */}
        <div className="mx-auto max-w-5xl max-lg:px-0 lg:px-8 mt-5 sm:mt-5 flex justify-end">
          <Link
            href="/blog"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#c2185b] hover:underline"
          >
            開催中の特集を全て見る
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c2185b] text-white shadow-sm transition-transform group-hover:translate-x-1">
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </div>
    </section>

  );
}
