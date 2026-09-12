import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "マイ予約",
  description: "ご予約の一覧・ステータス確認。",
  robots: { index: false, follow: false },
};

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
