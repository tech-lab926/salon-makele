"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, ListOrdered, CalendarDays, BookOpen, Loader2 } from "lucide-react";

interface Stats {
  cases: number;
  menus: number;
  pendingBookings: number;
  totalBookings: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/artist/summary");
        const json = await res.json();
        if (json.success && json.data) {
          setStats({
            cases: json.data.cases,
            menus: json.data.menus,
            pendingBookings: json.data.pendingBookings,
            totalBookings: json.data.totalBookings,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  const cards = [
    {
      label: "症例数",
      value: stats?.cases ?? 0,
      icon: Camera,
      href: "/dashboard/cases",
      color: "bg-pink-50 text-[#c2185b]",
    },
    {
      label: "メニュー数",
      value: stats?.menus ?? 0,
      icon: ListOrdered,
      href: "/dashboard/menus",
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "未対応の予約",
      value: stats?.pendingBookings ?? 0,
      icon: CalendarDays,
      href: "/dashboard/bookings",
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "総予約数",
      value: stats?.totalBookings ?? 0,
      icon: BookOpen,
      href: "/dashboard/bookings",
      color: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
      <p className="mt-1 text-sm text-gray-500">アクティビティの概要</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`inline-flex rounded-lg p-2.5 ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900">
              {card.value}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">{card.label}</p>
          </Link>
        ))}
      </div>

      {stats && stats.pendingBookings > 0 && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            {stats.pendingBookings}件の未対応の予約があります。
            <Link
              href="/dashboard/bookings"
              className="ml-2 underline hover:no-underline"
            >
              予約を確認する →
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
