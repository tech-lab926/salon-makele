"use client";

import { useState, useEffect } from "react";
import { 
  UserCircle2, 
  ShieldCheck, 
  Palette, 
  Settings2, 
  X,
  LogOut,
  ChevronUp
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DemoRoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);

  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const roleCookie = cookies.find(row => row.startsWith("demo_role="));
    if (roleCookie) {
      setActiveRole(roleCookie.split("=")[1]);
    }
  }, []);

  const [pendingRole, setPendingRole] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (pendingRole === undefined) return;
    
    if (pendingRole) {
      document.cookie = `demo_role=${pendingRole}; path=/; max-age=31536000`;
    } else {
      document.cookie = "demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    
    // Hard reload to ensure server components and all states refresh
    window.location.href = pendingRole === "admin" ? "/admin" : pendingRole === "artist" ? "/dashboard" : "/";
  }, [pendingRole]);

  const switchRole = (role: string | null) => {
    setPendingRole(role);
  };

  const roles = [
    {
      id: "admin",
      name: "管理者 (Admin)",
      icon: ShieldCheck,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      hoverBg: "hover:bg-amber-100",
      borderColor: "border-amber-200"
    },
    {
      id: "artist",
      name: "アーティスト (Artist)",
      icon: Palette,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      hoverBg: "hover:bg-pink-100",
      borderColor: "border-pink-200"
    },
    {
      id: "user",
      name: "一般ユーザー (User)",
      icon: UserCircle2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverBg: "hover:bg-blue-100",
      borderColor: "border-blue-200"
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      {/* Menu */}
      <div 
        className={cn(
          "overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-out dark:bg-gray-900/80",
          isOpen ? "mb-2 h-auto w-64 opacity-100 scale-100 translate-y-0" : "h-0 w-0 opacity-0 scale-90 translate-y-4 pointer-events-none"
        )}
      >
        <div className="p-3">
          <div className="mb-2 flex items-center justify-between px-2 py-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Demo Mode Controls
            </span>
            <button 
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          
          <div className="space-y-1">
            {roles.map((role, idx) => (
              <button
                key={role.id ?? `role-${idx}`}
                onClick={() => switchRole(role.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border border-transparent p-2.5 text-left transition-all duration-200",
                  role.hoverBg,
                  activeRole === role.id ? cn(role.bgColor, role.borderColor) : ""
                )}
              >
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shadow-sm border border-white/40", role.bgColor, role.color)}>
                  <role.icon size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{role.name}</span>
                  {activeRole === role.id && (
                    <span className="text-[10px] font-medium text-gray-400 italic">Active Session</span>
                  )}
                </div>
              </button>
            ))}
            
            <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
            
            <button
              onClick={() => switchRole(null)}
              className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <LogOut size={16} />
              </div>
              <span className="text-sm font-medium">Clear Demo Session</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group flex h-14 w-14 items-center justify-center rounded-full bg-[#c2185b] text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95",
          isOpen ? "bg-gray-800" : "animate-pulse hover:animate-none"
        )}
      >
        {isOpen ? (
          <ChevronUp className="h-6 w-6 rotate-180 transition-transform duration-300" />
        ) : (
          <div className="relative">
             <Settings2 className="h-6 w-6" />
             <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#c2185b] bg-white ring-2 ring-white/20" />
          </div>
        )}
      </button>
    </div>
  );
}
