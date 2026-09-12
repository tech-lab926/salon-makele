import React from "react";

export default function DefaultAvatar({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-full w-full items-center justify-center bg-[#cccccc] overflow-hidden ${className}`}>
      <svg
        viewBox="0 0 24 24"
        fill="white"
        className="h-full w-full scale-[1.2] translate-y-[15%]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="8" r="4.5" />
        <path d="M12 14c-5.5 0-10 4.5-10 10h20c0-5.5-4.5-10-10-10z" />
      </svg>
    </div>
  );
}
