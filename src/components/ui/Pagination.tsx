"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function createPageUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `${pathname}?${params.toString()}`;
  }

  const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis-start");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("ellipsis-end");
    pages.push(totalPages);
  }

  const baseBtn =
    "flex h-9 min-w-9 items-center justify-center rounded-md border text-[13px] font-medium transition-all duration-200 min-[768px]:max-[820px]:h-11 min-[768px]:max-[820px]:min-w-11 min-[768px]:max-[820px]:text-[15px]";

  const chevronIcon = "h-4 w-4 min-[768px]:max-[820px]:h-[18px] min-[768px]:max-[820px]:w-[18px]";

  return (
    <nav className="flex items-center justify-center gap-1.5 min-[768px]:max-[820px]:gap-2">
      {currentPage > 1 ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className={`${baseBtn} border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:text-gray-600`}
        >
          <ChevronLeft className={chevronIcon} />
        </Link>
      ) : (
        <span className={`${baseBtn} cursor-not-allowed border-gray-50 bg-gray-50/50 text-gray-300`}>
          <ChevronLeft className={chevronIcon} />
        </span>
      )}

      {pages.map((p) =>
        typeof p === "string" ? (
          <span
            key={p}
            className={`${baseBtn} cursor-default border-gray-100 bg-white font-normal text-gray-400`}
          >
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={createPageUrl(p)}
            className={`${baseBtn} ${
              p === currentPage
                ? "border-transparent bg-gradient-to-br from-[#e37d9c] to-[#c2185b] text-white shadow-[0_2px_8px_rgba(194,24,91,0.25)]"
                : "border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            {p}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className={`${baseBtn} border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:text-gray-600`}
        >
          <ChevronRight className={chevronIcon} />
        </Link>
      ) : (
        <span className={`${baseBtn} cursor-not-allowed border-gray-50 bg-gray-50/50 text-gray-300`}>
          <ChevronRight className={chevronIcon} />
        </span>
      )}
    </nav>
  );
}
