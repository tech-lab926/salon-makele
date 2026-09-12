"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, Search, User, LogOut, LayoutDashboard } from "lucide-react";

interface AuthUser {
  id: string;
  name: string;
  role: string;
  image?: string | null;
  dashboardUrl: string;
}

async function authMeFetcher(url: string): Promise<AuthUser | null> {
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) return null;
  return data.data ?? null;
}

/** Hamburger drawer only: slightly larger type on tablet widths (sub-`lg`), not on narrow phones. */
const navTabletTextBump = "min-[768px]:max-[1023px]:text-base";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { data: user, mutate, isLoading } = useSWR("/api/auth/me", authMeFetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 60_000,
    revalidateIfStale: true,
  });

  useEffect(() => {
    mutate();
  }, [pathname, mutate]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    function closeOnDesktop() {
      if (mq.matches) setMobileMenuOpen(false);
    }
    mq.addEventListener("change", closeOnDesktop);
    return () => mq.removeEventListener("change", closeOnDesktop);
  }, []);


  const authLoaded = !isLoading;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut({ redirect: false });
      await mutate(null, { revalidate: false });
      router.push("/");
      router.refresh();
    } catch {
      /* ignore */
    } finally {
      setLoggingOut(false);
    }
  }

  const roleBadge = user?.role === "admin"
    ? "管理者"
    : user?.role === "artist"
      ? "アーティスト"
      : null;

  return (
    <header className="relative z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      {/* Row 1: Logo and Auth */}
      <div className="mx-auto flex h-14 w-full max-w-[1050px] items-center justify-between px-3 sm:h-16 md:h-16 lg:h-16 xl:h-16 2xl:h-[4.75rem] sm:px-6 min-[900px]:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/makele_logo.png"
            className="h-9 w-auto sm:h-11 md:h-12"
            alt="MAKELE Logo"
            width={150}
            height={60}
            priority
          />
        </Link>

        <div className="flex items-center gap-4">
          {/* Desktop Auth and Reservation Button */}
          <div className="hidden min-[900px]:flex items-center gap-6">
            {!authLoaded ? (
              <div className="h-[2.375rem] w-28 animate-pulse rounded-full bg-gray-100" />
            ) : (
              <div className="flex items-center gap-6 mr-[3px] min-[1200px]:mr-[10px]">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-gray-800">
                        {user.name}
                      </span>
                      {roleBadge && (
                        <span className="text-[11px] text-[#c2185b] font-medium">
                          {roleBadge}
                        </span>
                      )}
                    </div>
                    <Link
                      href={
                        user.role === "admin" ? "/admin" : user.role === "artist" ? "/dashboard" : "/mypage"
                      }
                      className="group/avatar flex h-[2.375rem] w-[2.375rem] items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-[#c2185b]/10 hover:text-[#c2185b] transition-all overflow-hidden border border-transparent hover:border-[#c2185b]/20"
                    >
                      {user.image ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={user.image}
                            alt={user.name}
                            fill
                            className="object-cover"
                           unoptimized={true} />
                        </div>
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex h-[2.375rem] w-[2.375rem] items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="text-sm font-bold text-gray-600 hover:text-[#c2185b] transition-colors"
                  >
                    ログイン
                  </Link>
                )}

                <Link
                  href="/search"
                  className="rounded-full bg-[#c2185b] px-[1.875rem] py-2.5 md:px-7 md:py-2 text-sm font-black text-white shadow-lg shadow-pink-200 transition-all hover:bg-[#a3154d] hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  予約をする
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Only Login Button */}
          <div className="min-[900px]:hidden flex items-center pr-1">
            {authLoaded && !user && (
              <Link
                href="/login"
                className="text-[13px] font-bold text-[#c2185b]"
              >
                ログイン
              </Link>
            )}
            {user && (
               <Link
                href={user.role === "admin" ? "/admin" : user.role === "artist" ? "/dashboard" : "/mypage"}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-50 text-[#c2185b] overflow-hidden border border-pink-100"
              >
                {user.image ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={user.image}
                      alt={user.name}
                      fill
                      className="object-cover"
                     unoptimized={true} />
                  </div>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Only: Row 2 Navigation */}
      {/* Mobile/Tablet Row 2 Navigation */}
      <div className="min-[900px]:hidden bg-white border-b border-gray-50">
        <div className="mx-auto flex max-w-[500px] items-center justify-between px-6 py-2 min-[768px]:max-w-[720px] min-[768px]:px-10">
          <Link href="/cases" className="text-[13px] font-bold text-gray-500 hover:text-[#c2185b] min-[768px]:text-[14px]">
            症例一覧
          </Link>
          
          <Link href="/artists" className="text-[13px] font-bold text-gray-500 hover:text-[#c2185b] min-[768px]:text-[14px]">
            アーティスト
          </Link>

          <Link href="/blog" className="text-[13px] font-bold text-gray-500 hover:text-[#c2185b] min-[768px]:text-[14px]">
            ブログ
          </Link>

          <Link href="/search" className="text-[13px] font-bold text-[#c2185b] min-[768px]:text-[14px]">
            予約
          </Link>

          <Link href="/search" className="text-gray-400 hover:text-[#c2185b]">
            <Search className="h-4 w-4 min-[768px]:h-5 min-[768px]:w-5" />
          </Link>
        </div>
      </div>

      {/* Row 2: Navigation Links (Desktop Only) */}
      <div className="hidden min-[900px]:block">
        <div className="mx-auto flex max-w-[1050px] items-center justify-between px-24 py-2 lg:py-2 xl:py-2 2xl:py-3.5">
          <Link
            href="/cases"
            className="text-[15px] font-bold text-gray-600 transition-colors hover:text-[#c2185b]"
          >
            症例一覧
          </Link>
          <Link
            href="/artists"
            className="text-[15px] font-bold text-gray-600 transition-colors hover:text-[#c2185b]"
          >
            アーティスト
          </Link>
          <Link
            href="/blog"
            className="text-[15px] font-bold text-gray-600 transition-colors hover:text-[#c2185b]"
          >
            ブログ
          </Link>
          {user && (
            <Link
              href="/mypage"
              className="text-[15px] font-bold text-gray-600 transition-colors hover:text-[#c2185b]"
            >
              マイページ
            </Link>
          )}
          <Link
            href="/search"
            className="text-gray-400 transition-colors hover:text-[#c2185b]"
          >
            <Search className="h-5 w-5" />
          </Link>
        </div>
      </div>


      {mobileMenuOpen && (
        <div
          id="header-mobile-nav"
          className="absolute left-0 top-full z-50 w-full border-t border-gray-100 bg-white shadow-xl min-[900px]:hidden max-h-[min(70vh,calc(100dvh-5rem))] overflow-y-auto"
        >
          <nav className="flex flex-col gap-0.5 px-4 py-3 sm:px-5">
            <Link
              href="/cases"
              className={`rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-pink-50 hover:text-[#c2185b] ${navTabletTextBump}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              症例一覧
            </Link>
            <Link
              href="/artists"
              className={`rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-pink-50 hover:text-[#c2185b] ${navTabletTextBump}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              アーティスト
            </Link>
            <Link
              href="/blog"
              className={`rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-pink-50 hover:text-[#c2185b] ${navTabletTextBump}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              ブログ
            </Link>
            <Link
              href="/search"
              className={`rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-pink-50 hover:text-[#c2185b] ${navTabletTextBump}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              予約をする
            </Link>
            {user && (
              <>
                <Link
                  href="/mypage"
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-pink-50 hover:text-[#c2185b] ${navTabletTextBump}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  マイページ
                </Link>
                <Link
                  href="/bookings"
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-pink-50 hover:text-[#c2185b] ${navTabletTextBump}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  予約一覧
                </Link>
              </>
            )}
            <Link
              href="/search"
              className={`rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-pink-50 hover:text-[#c2185b] ${navTabletTextBump}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              検索
            </Link>
            <div className="my-1 border-t border-gray-100" />
            {user ? (
              <>
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-50 text-[#c2185b] overflow-hidden border border-pink-100">
                    {user.image ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={user.image}
                          alt={user.name}
                          fill
                          className="object-cover"
                         unoptimized={true} />
                      </div>
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium text-gray-800 ${navTabletTextBump}`}>{user.name}</p>
                    {roleBadge && (
                      <p className="text-xs text-gray-400">{roleBadge}</p>
                    )}
                  </div>
                </div>
                <Link
                  href={user.role === "user" ? "/mypage" : user.dashboardUrl}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-pink-50 hover:text-[#c2185b] ${navTabletTextBump}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {user.role === "user" ? "マイページ" : "ダッシュボード"}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  disabled={loggingOut}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 ${navTabletTextBump}`}
                >
                  <LogOut className="h-4 w-4" />
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className={`ml-3 w-[40%] self-start rounded-lg bg-[#c2185b] px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#880e4f] ${navTabletTextBump}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                ログイン
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
