"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const hasConsented = localStorage.getItem("cookie_consent");
    if (!hasConsented) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "true");
    // Optionally: If we had a mechanism to configure session expiry length,
    // we would set it here (e.g., cookie maxAge = 30 days vs session only).
    setShow(false);
  };

  const handleDecline = () => {
    // We still hide the banner, but we might set a 'false' flag 
    // to strictly limit cookie usage in the app (like analytics).
    localStorage.setItem("cookie_consent", "false");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 pb-20 sm:pb-6 pointer-events-none">
      <div className="mx-auto max-w-4xl pointer-events-auto rounded-xl bg-white p-5 shadow-2xl ring-1 ring-black/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 pr-4">
          <p className="text-sm font-medium text-gray-900">
            Cookieの使用について
          </p>
          <p className="mt-1 text-xs text-gray-500 leading-relaxed">
            当サイトでは、ログイン状態の保持やユーザー体験の向上のためにCookieを使用しています。同意していただくことで、パスワードやセッションが一定期間記憶されます。
          </p>
        </div>
        
        <div className="flex shrink-0 items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleDecline}
            className="flex-1 sm:flex-none rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            拒否する
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 sm:flex-none rounded-lg bg-[#c2185b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#880e4f] shadow-sm transition-colors"
          >
            同意する
          </button>
          <button
            onClick={() => setShow(false)}
            className="hidden sm:block p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="閉じる"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
