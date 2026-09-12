"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ShieldCheck, Palette, User as UserIcon } from "lucide-react";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  stripeCustomerId: string | null;
  lineUserId: string | null;
  _count: {
    bookings: number;
    reviews: number;
    favorites: number;
  };
  artist: {
    id: string;
    displayName: string;
    registrationStatus: string;
    isPublished: boolean;
    clinicName: string | null;
    createdAt: string;
    _count?: {
      bookings: number;
    };
  } | null;
}

const roleBadge: Record<string, { label: string; className: string; icon: typeof UserIcon }> = {
  ADMIN: { label: "管理者", className: "bg-purple-50 text-purple-700 border-purple-200", icon: ShieldCheck },
  ARTIST: { label: "アーティスト", className: "bg-pink-50 text-[#c2185b] border-pink-200", icon: Palette },
  USER: { label: "一般ユーザー", className: "bg-gray-100 text-gray-600 border-gray-200", icon: UserIcon },
};

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setUser(data.data);
        } else {
          setError(data.error || "ユーザーの取得に失敗しました");
        }
      })
      .catch(() => setError("エラーが発生しました"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#c2185b]" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        {error || "ユーザーが見つかりません"}
      </div>
    );
  }

  const badge = roleBadge[user.role] || roleBadge.USER;
  const RoleIcon = badge.icon;

  return (
    <div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">ユーザー詳細</h1>
        <span className={`ml-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${badge.className}`}>
          <RoleIcon className="h-4 w-4" />
          {badge.label}
        </span>
        {user.deletedAt && (
          <span className="ml-2 rounded-full bg-red-100 text-red-700 px-3 py-1 text-sm font-medium border border-red-200">
            削除済み
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">基本情報</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">ID</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">{user.id}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">名前</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">{user.name}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">メールアドレス</div>
                <div className="col-span-2 text-sm font-medium text-gray-900 break-all">{user.email}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">メール認証</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {user.emailVerified ? (
                    <span className="text-green-600 font-semibold">認証済み</span>
                  ) : (
                    <span className="text-gray-400">未認証</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">登録日時</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleString("ja-JP")}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">最終更新</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {new Date(user.updatedAt).toLocaleString("ja-JP")}
                </div>
              </div>
              {user.deletedAt && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-red-500">削除日時</div>
                  <div className="col-span-2 text-sm font-medium text-red-600">
                    {new Date(user.deletedAt).toLocaleString("ja-JP")}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">外部連携情報</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">Stripe ID</div>
                <div className="col-span-2 text-sm font-medium text-gray-900 break-all">
                  {user.stripeCustomerId || "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">LINE ID</div>
                <div className="col-span-2 text-sm font-medium text-gray-900 break-all">
                  {user.lineUserId || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">利用統計</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">予約数</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {user.role === "ADMIN" ? "対象外" : user.role === "ARTIST" ? `${user.artist?._count?.bookings || 0} 件` : `${user._count.bookings} 件`}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">レビュー数</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {user._count.reviews} 件
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">お気に入り数</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {user._count.favorites} 件
                </div>
              </div>
            </div>
          </div>

          {user.artist && (
            <div className="rounded-xl border border-[#fce4ec] bg-white shadow-sm overflow-hidden">
              <div className="bg-[#fce4ec] px-6 py-4 border-b border-[#f8bbd0]">
                <h2 className="font-semibold text-[#c2185b]">アーティスト情報</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-gray-500">アーティストID</div>
                  <div className="col-span-2 text-sm font-medium text-gray-900">
                    {user.artist.id}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-gray-500">表示名</div>
                  <div className="col-span-2 text-sm font-medium text-gray-900">
                    {user.artist.displayName}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-gray-500">クリニック名</div>
                  <div className="col-span-2 text-sm font-medium text-gray-900">
                    {user.artist.clinicName || "—"}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-gray-500">審査ステータス</div>
                  <div className="col-span-2 text-sm font-medium text-gray-900">
                    {user.artist.registrationStatus}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-gray-500">公開状態</div>
                  <div className="col-span-2 text-sm font-medium text-gray-900">
                    {user.artist.isPublished ? "公開中" : "非公開"}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-sm text-gray-500">アーティスト登録</div>
                  <div className="col-span-2 text-sm font-medium text-gray-900">
                    {new Date(user.artist.createdAt).toLocaleString("ja-JP")}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => router.push(`/admin/artists/${user.artist?.id}`)}
                    className="text-sm font-medium text-[#c2185b] hover:text-[#880e4f] underline"
                  >
                    アーティスト詳細を見る
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
