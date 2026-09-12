"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { Loader2, Images } from "lucide-react";
import { isGoogleSignInEnabledClient } from "@/lib/runtime-flags";

interface Props {
  onPick: (url: string) => void;
  slotLabel: string;
}

export default function GooglePhotosPicker({ onPick, slotLabel }: Props) {
  const enabled = isGoogleSignInEnabledClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up polling when component unmounts
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  async function handleOpenPicker() {
    setLoading(true);
    setError("");
    setNeedsReconnect(false);

    try {
      // 1. Create a Picker Session on the backend
      const res = await fetch("/api/artist/photos/picker", { method: "POST" });
      const data = await res.json();
      
      if (!data.success || !data.data?.pickerUri) {
        setError(typeof data.error === "string" ? data.error : "認証が必要です");
        if (data.statusCode === 403 || data.error?.includes("token")) {
          setNeedsReconnect(true);
        }
        setLoading(false);
        return;
      }

      const { sessionId, pickerUri } = data.data;

      // 2. Open the Picker URL in a popup window
      const width = 600;
      const height = 800;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      popupRef.current = window.open(
        pickerUri,
        "GooglePhotosPicker",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // 3. Poll for completion every 2 seconds
      const startTime = Date.now();
      pollingRef.current = setInterval(async () => {
        // Stop polling after 5 minutes
        if (Date.now() - startTime > 5 * 60 * 1000) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setLoading(false);
          return;
        }

        try {
          // Add cache buster parameter to prevent Next.js from caching the GET request
          const statusRes = await fetch(`/api/artist/photos/picker?sessionId=${sessionId}&t=${Date.now()}`);
          const statusData = await statusRes.json();
          
          if (!statusData.success) {
            console.error("Polling returned error:", statusData.error);
            // Optionally stop polling if it's a fatal error like 401
            if (statusData.error === "Unauthorized" || statusData.error === "Google Photos access token not found") {
              if (pollingRef.current) clearInterval(pollingRef.current);
              if (popupRef.current) popupRef.current.close();
              setError("認証エラーが発生しました。再接続してください。");
              setNeedsReconnect(true);
              setLoading(false);
            }
            return;
          }
          
          if (statusData.success && statusData.data?.mediaItemsSet) {
            // User finished selecting
            if (pollingRef.current) clearInterval(pollingRef.current);
            if (popupRef.current) popupRef.current.close();
            
            const url = statusData.data.url;
            if (url) {
              onPick(url); 
            } else {
              setError("画像の取得に失敗しました");
            }
            setLoading(false);
          }
        } catch (pollErr) {
          console.error("Polling error:", pollErr);
        }
      }, 2000);
      
    } catch (err) {
      setError("エラーが発生しました");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 p-3">
      <button
        type="button"
        onClick={handleOpenPicker}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 text-xs font-medium text-[#c2185b] hover:underline disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          <Images className="h-4 w-4 shrink-0" />
        )}
        Googleフォトから{slotLabel}を選ぶ
      </button>

      {error && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span>{error}</span>
          {needsReconnect ? (
            <button
              type="button"
              className="mt-2 block w-full rounded-md bg-white px-2 py-1.5 text-center text-xs font-semibold text-[#c2185b] ring-1 ring-amber-200 hover:bg-amber-50"
              onClick={() =>
                signIn("google", {
                  callbackUrl: typeof window !== "undefined" ? window.location.href : "/",
                })
              }
            >
              Googleで再接続（写真の参照を許可）
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
