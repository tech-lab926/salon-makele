import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null): string {
  if (price === null) return "要相談";
  return `¥${price.toLocaleString("ja-JP")}`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function formatBookingTime(startTime: Date, durationMin?: number | null): string {
  const startStr = startTime.toISOString().slice(11, 16);
  if (!durationMin) return startStr;
  const end = new Date(startTime.getTime() + durationMin * 60000);
  const endStr = end.toISOString().slice(11, 16);
  return `${startStr}〜${endStr}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getPageRange(page: number, limit: number) {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}

export function getOptimizedMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("/uploads")) {
    return url.replace("/uploads", "/api/media");
  }
  return url;
}
