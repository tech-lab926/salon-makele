"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Camera, FileText, BookOpen, Loader2 } from "lucide-react";

interface Stats {
  artists: number;
  cases: number;
  blogs: number;
  bookings: number;
  pendingCases: number;
  pendingBookings: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch_stats() {
      try {
        const res = await fetch("/api/admin/summary");
        const json = await res.json();
        if (json.success && json.data) {
          setStats({
            artists: json.data.artists,
            cases: json.data.cases,
            blogs: json.data.blogs,
            bookings: json.data.bookings,
            pendingCases: json.data.pendingCases,
            pendingBookings: json.data.pendingBookings,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetch_stats();
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
      label: "アーティスト",
      value: stats?.artists ?? 0,
      icon: Users,
      href: "/admin/artists",
      color: "bg-pink-50 text-[#c2185b]",
    },
    {
      label: "症例",
      value: stats?.cases ?? 0,
      icon: Camera,
      href: "/admin/cases",
      color: "bg-purple-50 text-purple-600",
      badge:
        stats?.pendingCases
          ? `${stats.pendingCases}件 未承認`
          : undefined,
    },
    {
      label: "ブログ",
      value: stats?.blogs ?? 0,
      icon: FileText,
      href: "/admin/blogs",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "予約",
      value: stats?.bookings ?? 0,
      icon: BookOpen,
      href: "/admin/bookings",
      color: "bg-amber-50 text-amber-600",
      badge:
        stats?.pendingBookings
          ? `${stats.pendingBookings}件 未対応`
          : undefined,
    },
    {
      label: "ヒーローバナー",
      value: "管理",
      icon: Camera,
      href: "/admin/hero",
      color: "bg-indigo-50 text-indigo-600",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">管理ダッシュボード</h1>
      <p className="mt-1 text-sm text-gray-500">サイト全体の概要</p>

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
            {card.badge && (
              <p className="mt-2 text-xs font-medium text-amber-600">
                {card.badge}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
