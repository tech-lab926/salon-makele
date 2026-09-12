"use client";

import { useEffect } from "react";

interface Props {
  targetType: "artist" | "case";
  targetId: string;
}

export default function ViewTracker({ targetType, targetId }: Props) {
  useEffect(() => {
    // PERF: Client-side dedup — skip the network request entirely
    // if this target was already viewed in this browser session.
    const dedupKey = `viewed:${targetType}:${targetId}`;
    try {
      if (sessionStorage.getItem(dedupKey)) return;
    } catch {
      // sessionStorage may be unavailable (private browsing); continue.
    }

    const controller = new AbortController();
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId }),
      signal: controller.signal,
    })
      .then(() => {
        try {
          sessionStorage.setItem(dedupKey, "1");
        } catch {
          // ignore
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [targetType, targetId]);

  return null;
}
