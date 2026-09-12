"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Camera,
  ListOrdered,
  CalendarDays,
  BookOpen,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "プロフィール編集", icon: User },
  { href: "/dashboard/cases", label: "症例管理", icon: Camera },
  { href: "/dashboard/menus", label: "メニュー管理", icon: ListOrdered },
  { href: "/dashboard/availability", label: "空き状況管理", icon: CalendarDays },
  { href: "/dashboard/bookings", label: "予約管理", icon: BookOpen },
  { href: "/dashboard/notifications", label: "お知らせ", icon: Bell },
];

export default function DashboardSidebar({ artistName }: { artistName?: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await signOut({ redirect: false });
    window.location.href = "/login";
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header: Logo + close button side by side */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Image
            src="/makele_logo.png"
            className="h-7 w-auto"
            alt="MAKELE Logo"
            width={120}
            height={40}
            priority
          />
          <span className="rounded bg-pink-50 px-2 py-0.5 text-xs font-bold tracking-widest text-[#c2185b]">
            ARTIST
          </span>
        </Link>
        {/* X button only visible on mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-2 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {artistName && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2.5 text-sm text-gray-700">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs text-gray-400 font-medium">ようこそ</span>
              <span className="truncate font-semibold">{artistName}</span>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
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
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          ログアウト
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger — only shown when sidebar is closed */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-md lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-gray-200 bg-white transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
