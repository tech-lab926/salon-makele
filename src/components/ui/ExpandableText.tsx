"use client";
import { useState } from "react";

export default function ExpandableText({ 
  text, 
  className = "", 
  title = "" 
}: { 
  text: string; 
  className?: string;
  title?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <span
      title={title}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(!isExpanded);
      }}
      className={`cursor-pointer block max-w-full transition-all duration-200 ${isExpanded ? "whitespace-normal break-words" : "truncate"} ${className}`}
    >
      {text}
    </span>
  );
}
