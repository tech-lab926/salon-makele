import { SearchX } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-50">
        <SearchX className="h-8 w-8 text-[#c2185b]" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-gray-500">{description}</p>}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-6 rounded-full bg-[#c2185b] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#880e4f]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
