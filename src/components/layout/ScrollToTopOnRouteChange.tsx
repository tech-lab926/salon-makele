"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

/** Scroll the document to the top on client route changes (Link can preserve y-offset otherwise). */
export default function ScrollToTopOnRouteChange() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
