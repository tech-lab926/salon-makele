"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Camera,
  Tag,
  Layers,
  MapPin,
  FileText,
  BookOpen,
  LogOut,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/admin/artists", label: "アーティスト管理", icon: Users },
  { href: "/admin/cases", label: "症例管理", icon: Camera },
  { href: "/admin/categories", label: "カテゴリ管理", icon: Tag },
  { href: "/admin/techniques", label: "技法管理", icon: Layers },
  { href: "/admin/areas", label: "エリア管理", icon: MapPin },
  { href: "/admin/users", label: "ユーザー管理", icon: Users },
  { href: "/admin/blogs", label: "ブログ管理", icon: FileText },
  { href: "/admin/bookings", label: "予約管理", icon: BookOpen },
  { href: "/admin/hero", label: "ヒーローバナー管理", icon: Camera },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await signOut({ redirect: false });
    window.location.href = "/login";
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6 pt-2">
        <Link href="/admin" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <Image
            src="/makele_logo.png"
            className="h-8 w-auto"
            alt="MAKELE Logo"
            width={140}
            height={48}
            priority
          />
          <span className="rounded bg-pink-50 px-2 py-0.5 text-xs font-bold tracking-widest text-[#c2185b]">
            ADMIN
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-pink-50 text-[#c2185b]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          サイトを表示
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          ログアウト
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden"
      >
        {mobileOpen ? (
          <X className="h-5 w-5 text-gray-600" />
        ) : (
          <Menu className="h-5 w-5 text-gray-600" />
        )}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-gray-200 bg-white transition-transform lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>

      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block h-screen sticky top-0">
        {sidebar}
      </aside>
    </>
  );
}
