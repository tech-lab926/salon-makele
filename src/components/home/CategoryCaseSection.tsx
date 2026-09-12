"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import CaseCard from "./CaseCard";

interface Artist {
  id: string | bigint;
  displayName: string;
  profileImgUrl: string | null;
  area: { prefecture: string; city: string | null };
}

interface Case {
  id: string | bigint;
  title: string;
  afterImgUrl: string;
  artist: Artist;
}

interface CategoryCaseSectionProps {
  categoryName: string;
  categoryId: string;
  cases: Case[];
}

export default function CategoryCaseSection({ categoryName, categoryId, cases }: CategoryCaseSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!cases || cases.length === 0) return null;

  return (
    <section className="bg-white py-6 sm:py-4 lg:py-5 border-t border-gray-50 first:border-0">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
        <div className="mx-auto max-w-5xl max-lg:px-0 lg:px-8">
          <div className="border-b border-gray-100 pb-2 sm:pb-3">
            <h3 className="text-base font-bold text-gray-900 sm:text-lg">
              「{categoryName}」のアートメイク症例
            </h3>
          </div>
        </div>

        {/* Centered Carousel Block - or Single Card Layout */}
        {cases.length === 1 ? (
          <div className="mx-auto max-w-5xl max-lg:px-0 lg:px-8 mt-4 sm:mt-4">
            <div className="flex gap-4">
              {cases.map((c) => (
                <CaseCard key={c.id.toString()} caseItem={c} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-start group/nav sm:mt-4 lg:justify-center">
            {/* Left Arrow */}
            <button
              onClick={() => scroll("left")}
              className="hidden xl:flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c2185b] text-white shadow-md transition-all hover:bg-[#880e4f] hover:scale-110 active:scale-95 mr-1"
              aria-label="Previous cases"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="relative min-w-0 flex-1 lg:flex-none lg:w-fit lg:max-w-[1000px] lg:overflow-hidden">
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-2 [touch-action:pan-x_pan-y] [scrollbar-width:none] snap-x snap-mandatory max-lg:pl-0 max-lg:pr-6 lg:px-4 sm:gap-6 max-lg:w-[calc(100%+1.5rem)] max-lg:-mr-6 [&::-webkit-scrollbar]:hidden"
              >
                {cases.map((c) => (
                  <CaseCard key={c.id.toString()} caseItem={c} />
                ))}
              </div>
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => scroll("right")}
              className="hidden xl:flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#c2185b] text-white shadow-md transition-all hover:bg-[#880e4f] hover:scale-110 active:scale-95 ml-1"
              aria-label="Next cases"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}



        {/* Footer Link - Restricted to max-w-5xl */}
        <div className="mx-auto max-w-5xl max-lg:px-0 lg:px-8 mt-5 sm:mt-4 flex justify-end">
          <Link
            href={`/cases?categoryId=${encodeURIComponent(categoryId)}`}
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#c2185b] hover:underline"
          >
            「{categoryName}」の症例をすべて見る
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c2185b] text-white shadow-sm transition-transform group-hover:translate-x-1">
              <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>

      </div>
    </section>
  );
}
