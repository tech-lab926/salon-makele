"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Loader2 } from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setNotifications(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">お知らせ</h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0 ? `未読 ${unreadCount}件` : "すべて既読です"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Check className="h-4 w-4" />
            すべて既読にする
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="mt-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">お知らせはまだありません</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                n.isRead
                  ? "border-gray-100 bg-white"
                  : "border-pink-200 bg-pink-50/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`font-medium ${n.isRead ? "text-gray-700" : "text-gray-900"}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="mt-1 text-sm text-gray-500">{n.body}</p>
                  )}
                </div>
                {!n.isRead && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#c2185b]" />
                )}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {new Date(n.createdAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
