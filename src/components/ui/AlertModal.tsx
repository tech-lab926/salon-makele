"use client";

import { AlertTriangle, Info } from "lucide-react";
import { useEffect } from "react";

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
  type?: "warning" | "error" | "info";
}

export default function AlertModal({
  isOpen,
  title,
  message,
  buttonText = "OK",
  onClose,
  type = "warning",
}: AlertModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const config = {
    warning: {
      icon: <AlertTriangle className="w-6 h-6" />,
      bg: "bg-orange-100",
      text: "text-orange-600",
      btn: "bg-[#c2185b] hover:bg-[#880e4f]",
    },
    error: {
      icon: <AlertTriangle className="w-6 h-6" />,
      bg: "bg-red-100",
      text: "text-red-600",
      btn: "bg-red-600 hover:bg-red-700",
    },
    info: {
      icon: <Info className="w-6 h-6" />,
      bg: "bg-blue-100",
      text: "text-blue-600",
      btn: "bg-[#c2185b] hover:bg-[#880e4f]",
    },
  };

  const style = config[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full shrink-0 ${style.bg} ${style.text}`}>
              {style.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-line">{message}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className={`px-6 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${style.btn}`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
