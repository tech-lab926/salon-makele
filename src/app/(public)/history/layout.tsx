import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "閲覧履歴",
  description: "最近閲覧した症例・アーティスト（ログインまたは端末に紐づく履歴）。",
  robots: { index: false, follow: false },
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
