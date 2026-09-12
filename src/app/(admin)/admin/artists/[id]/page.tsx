"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, Palette, MapPin, Instagram, Twitter, Link as LinkIcon, CheckCircle2, XCircle, Clock } from "lucide-react";
import Image from "next/image";

interface ArtistDetail {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  areaId: string;
  profileImgUrl: string | null;
  medicalLicenseUrl: string | null;
  artmakeDiplomaUrl: string | null;
  clinicName: string | null;
  clinicAddress: string | null;
  businessHours: string | null;
  yearsOfExperience: number | null;
  registrationStatus: string;
  isPublished: boolean;
  isSponsored: boolean;
  priorityRank: number;
  email: string;
  instagramUrl: string | null;
  twitterUrl: string | null;
  lineUrl: string | null;
  skillCategoryIds: string[];
}

export default function AdminArtistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/artists/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setArtist(data.data);
        } else {
          setError(data.error || "アーティストの取得に失敗しました");
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

  if (error || !artist) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-600">
        {error || "アーティストが見つかりません"}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">アーティスト詳細</h1>
        
        {artist.registrationStatus === "PROVISIONAL" && (
          <span className="ml-4 inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-sm font-medium text-yellow-700 border border-yellow-200">
            <Clock className="h-4 w-4" /> 仮登録
          </span>
        )}
        {artist.registrationStatus === "APPROVED" && (
          <span className="ml-4 inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 border border-green-200">
            <CheckCircle2 className="h-4 w-4" /> 承認済
          </span>
        )}
        {artist.registrationStatus === "REJECTED" && (
          <span className="ml-4 inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-700 border border-red-200">
            <XCircle className="h-4 w-4" /> 却下
          </span>
        )}

        <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium border ${artist.isPublished ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {artist.isPublished ? "公開中" : "非公開"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">基本情報</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-6 pb-4 border-b border-gray-50">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 border border-gray-200">
                  {artist.profileImgUrl ? (
                    <Image src={artist.profileImgUrl} alt={artist.displayName} width={80} height={80} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <Palette className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{artist.displayName}</h3>
                  <p className="text-sm text-gray-500">{artist.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-sm text-gray-500">ID</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">{artist.id}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">ユーザーID</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">{artist.userId}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">自己紹介</div>
                <div className="col-span-2 text-sm text-gray-900 whitespace-pre-wrap">
                  {artist.bio || "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">経験年数</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {artist.yearsOfExperience ? `${artist.yearsOfExperience}年` : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">クリニック・エリア情報</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">クリニック名</div>
                <div className="col-span-2 text-sm font-medium text-gray-900">{artist.clinicName || "—"}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">住所</div>
                <div className="col-span-2 text-sm font-medium text-gray-900 flex items-start gap-1">
                  {artist.clinicAddress ? (
                    <>
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span>{artist.clinicAddress}</span>
                    </>
                  ) : "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-sm text-gray-500">営業時間</div>
                <div className="col-span-2 text-sm font-medium text-gray-900 whitespace-pre-wrap">{artist.businessHours || "—"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">SNS・リンク</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-sm text-gray-500 flex items-center gap-1.5">
                  <Instagram className="h-4 w-4" /> Instagram
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-900 break-all">
                  {artist.instagramUrl ? (
                    <a href={artist.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {artist.instagramUrl}
                    </a>
                  ) : "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-sm text-gray-500 flex items-center gap-1.5">
                  <Twitter className="h-4 w-4" /> Twitter (X)
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-900 break-all">
                  {artist.twitterUrl ? (
                    <a href={artist.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {artist.twitterUrl}
                    </a>
                  ) : "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-sm text-gray-500 flex items-center gap-1.5">
                  <LinkIcon className="h-4 w-4" /> LINE / その他
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-900 break-all">
                  {artist.lineUrl ? (
                    <a href={artist.lineUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {artist.lineUrl}
                    </a>
                  ) : "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">資格・証明書</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">医師免許・看護師免許</div>
                {artist.medicalLicenseUrl ? (
                  <a href={artist.medicalLicenseUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                    <img src={artist.medicalLicenseUrl} alt="Medical License" className="h-32 w-auto object-contain rounded-lg border border-gray-200 bg-gray-50 hover:opacity-90 transition-opacity" />
                  </a>
                ) : (
                  <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-gray-100">提出なし</div>
                )}
              </div>
              
              <div className="pt-2 border-t border-gray-50">
                <div className="text-sm font-medium text-gray-700 mb-2">アートメイク修了証（ディプロマ）</div>
                {artist.artmakeDiplomaUrl ? (
                  <a href={artist.artmakeDiplomaUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                    <img src={artist.artmakeDiplomaUrl} alt="Diploma" className="h-32 w-auto object-contain rounded-lg border border-gray-200 bg-gray-50 hover:opacity-90 transition-opacity" />
                  </a>
                ) : (
                  <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-gray-100">提出なし</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
