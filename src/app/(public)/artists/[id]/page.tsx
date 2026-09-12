import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Heart, Link2, MapPin, MessageCircle, Star } from "lucide-react";
import type { Metadata } from "next";
import { absoluteAssetUrl, getSiteUrl } from "@/lib/site-url";
import { SEO_SITE_NAME_JA } from "@/lib/seo-copy";
import JsonLd, { artistJsonLd, breadcrumbJsonLd } from "@/components/seo/JsonLd";
import ViewTracker from "@/components/tracking/ViewTracker";
import DefaultAvatar from "@/components/ui/DefaultAvatar";
import {
  getPublishedArtistDetailById,
} from "@/lib/artist-public-detail";

export const dynamic = "force-dynamic";
export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

function formatYen(price: number | null): string {
  if (price == null) return "要相談";
  return `¥${price.toLocaleString("ja-JP")}`;
}

/** 「姓 名」形式の表示名を、見出し用に姓・名に分割（半角・全角スペース対応）。 */
function splitDisplayNameForHeading(displayName: string): { family: string; given: string | null } {
  const t = displayName.trim();
  const m = t.match(/^(\S+)\s+(.+)$/);
  if (!m) return { family: t, given: null };
  return { family: m[1], given: m[2].trim() || null };
}

export function generateStaticParams() {
  return [] as { id: string }[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artist = await getPublishedArtistDetailById(id);
  if (!artist) {
    return { title: "アーティストが見つかりません", robots: { index: false, follow: true } };
  }
  const description =
    artist.bio?.slice(0, 160) ||
    `${artist.displayName}（${artist.area.prefecture}）のアートメイクアーティスト。症例・メニュー・予約はMAKELEから。`;
  const title = `${artist.displayName} | アーティスト`;
  const keywords = [
    artist.displayName,
    artist.area.prefecture,
    "アートメイク",
    "アーティスト",
    SEO_SITE_NAME_JA,
    ...artist.skills.map((s) => s.name),
  ];
  const ogImages = artist.profileImgUrl
    ? [{ url: absoluteAssetUrl(artist.profileImgUrl), alt: `${artist.displayName}のプロフィール` }]
    : [];

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: `${artist.displayName} — アートメイクアーティスト`,
      description,
      url: `/artists/${id}`,
      locale: "ja_JP",
      type: "profile",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages[0] ? [ogImages[0].url] : undefined,
    },
    alternates: { canonical: `/artists/${id}` },
  };
}

export default async function ArtistDetailPage({ params }: Props) {
  const { id } = await params;
  const baseUrl = getSiteUrl();
  const artist = await getPublishedArtistDetailById(id);

  if (!artist) notFound();

  const topCases = artist.cases.slice(0, 6);
  const heroThumbs = artist.cases.slice(0, 4);
  const hasCases = topCases.length > 0;
  const avgRating = artist.avgRating;
  const reviewCount = artist.reviewCount;
  const favoriteCount = Math.max(18, artist.cases.length * 3);
  const { family: nameFamily, given: nameGiven } = splitDisplayNameForHeading(artist.displayName);

  const reviewCards = artist.reviews.map((r: any) => ({
    id: r.id,
    name: r.userName + " さん",
    rating: r.rating,
    label: r.menuName,
    body: r.comment,
    date: r.createdAt,
    avatar: r.avatarUrl || artist.profileImgUrl || "/demo/artists/artist_1.png"
  }));

  return (
    <div className="min-w-0 overflow-x-clip bg-[#faf8f8]">
      <ViewTracker targetType="artist" targetId={artist.id.toString()} />
      <JsonLd
        data={artistJsonLd({
          name: artist.displayName,
          area: artist.area.prefecture,
          bio: artist.bio,
          imageUrl: artist.profileImgUrl,
          id: artist.id.toString(),
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "ホーム", url: `${baseUrl}/` },
          { name: "アーティスト一覧", url: `${baseUrl}/artists` },
          { name: artist.displayName },
        ])}
      />
      {/* Seamless Breadcrumb Stripe */}
      <div className="min-w-0 bg-[#FFF3F6]">
        <div className="mx-auto w-full min-w-0 max-w-[calc(1000px+4rem)] px-6 py-2 text-[12px] text-gray-500 lg:px-8">
          <nav
            className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
            aria-label="パンくずリスト"
          >
            <Link href="/" className="shrink-0 text-gray-500 transition-colors hover:text-gray-800 hover:underline">
              TOP
            </Link>
            <span className="shrink-0 text-gray-400">&gt;</span>
            <Link href="/artists" className="min-w-0 break-words text-gray-500 transition-colors hover:text-gray-800 hover:underline">
              アーティスト一覧
            </Link>
            <span className="shrink-0 text-gray-400">&gt;</span>
            <span className="min-w-0 max-w-full break-words text-gray-600">
              {artist.displayName} さんの詳細ページ
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto w-full min-w-0 max-w-[calc(1000px+4rem)] px-6 py-6 lg:px-8 lg:py-8">
        <div className="grid min-w-0 grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(260px,300px)] lg:gap-3">
          <div className="order-1 min-w-0 lg:order-0 lg:col-start-1 lg:row-start-1">
            <section className="min-w-0 overflow-hidden rounded-[20px] border border-[#efe7e9] bg-white p-4 shadow-[0_8px_30px_rgba(17,24,39,0.03)] sm:p-5">
              <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] md:items-stretch md:gap-5 lg:gap-6">
                <div className="relative min-h-[280px] min-w-0 w-full overflow-hidden rounded-[18px] bg-[#f8f6f7] md:min-h-0 md:h-full">
                  {artist.profileImgUrl ? (
                    <Image
                      src={artist.profileImgUrl}
                      alt={`${artist.displayName}のプロフィール`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 280px"
                      priority
                     unoptimized={true} />
                  ) : (
                    <DefaultAvatar />
                  )}
                  <div className="absolute bottom-3 left-3 right-3 z-10 min-w-0">
                    <div className="grid min-w-0 grid-cols-4 gap-1.5 sm:gap-2">
                      {heroThumbs.map((c, index) => (
                        <Link
                          key={c.id}
                          href={`/cases/${c.id}`}
                          className="relative aspect-[4/5] overflow-hidden rounded-[8px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                        >
                          <Image
                            src={c.afterImgUrl}
                            alt={c.title}
                            fill
                            className="object-cover"
                            sizes="90px"
                           unoptimized={true} />
                          {index === heroThumbs.length - 1 && (
                            <span className="absolute inset-0 flex items-center justify-center bg-white/50 text-gray-800">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold shadow-sm">&gt;</span>
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex min-w-0 flex-col">
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-3 sm:justify-start sm:items-center">
                    <h1 className="flex min-w-0 flex-wrap items-baseline gap-x-1 font-serif font-medium tracking-[0.02em] text-gray-900">
                      <span className="min-w-0 break-all text-[30px] leading-tight sm:text-[34px]">{nameFamily}</span>
                      {nameGiven ? (
                        <span className="min-w-0 break-all text-[26px] leading-tight sm:text-[30px]">{nameGiven}</span>
                      ) : null}
                      <span className="shrink-0 text-[17px] leading-tight sm:text-[19px]">さん</span>
                    </h1>
                    <button
                      type="button"
                      className="inline-flex shrink-0 items-center gap-1.5 self-center rounded-full border border-[#ecdde2] bg-white px-3 py-1.5 text-[12px] font-medium leading-none text-[#d56d8d] shadow-sm hover:bg-gray-50"
                    >
                      <Heart className="h-4 w-4 text-[#d56d8d]" />
                      お気に入りに追加
                    </button>
                  </div>
                  
                  <div className="mt-2">
                    {artist.clinicName && (
                      <p className="text-[13px] font-medium text-gray-800">{artist.clinicName}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3">
                      <p className="flex items-center gap-1 text-[13px] text-gray-500">
                        <MapPin className="h-4 w-4" />
                        {artist.area.prefecture}{artist.area.city ? ` ${artist.area.city}` : ""}
                      </p>

                    </div>
                  </div>

                  {artist.skills.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {artist.skills.slice(0, 6).map((s) => (
                        <span key={s.id} className="rounded-full border border-[#fde2e9] bg-[#fdf2f5] px-4 py-1.5 text-[12px] font-medium text-black">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {reviewCount > 0 && (
                    <div className="mt-4 flex min-w-0 flex-wrap items-end gap-3 border-b border-[#f2eaed] pb-4">
                      <div className="flex items-end gap-1.5 text-[#d56d8d]">
                        <Star className="mb-0.5 h-5 w-5 fill-current" />
                        <span className="text-[34px] font-medium leading-none tracking-tight">{avgRating.toFixed(1)}</span>
                      </div>
                      <span className="mb-1.5 text-sm text-gray-500">({reviewCount}件)</span>
                      <div className="mb-1.5 ml-1 h-3 w-px bg-gray-300"></div>
                      <a href="#reviews" className="mb-1.5 text-[13px] font-medium text-gray-600 underline-offset-2 hover:underline">口コミを見る &gt;</a>
                    </div>
                  )}

                  <div className="mt-6 grid min-w-0 grid-cols-3 gap-1 px-0 text-center sm:gap-3 md:gap-4">
                    <div className="flex min-w-0 flex-col items-center">
                      <div className="mb-1 text-[12px] font-medium text-gray-500">症例実績</div>
                      <div className="flex min-h-[62px] min-w-0 max-w-full items-center justify-center gap-0.5">
                        <Image src="/laurel-left.svg" alt="" width={18} height={44} className="shrink-0" />
                        <div className="flex min-w-0 max-w-full flex-col items-center justify-center px-0.5">
                          <div className="flex min-w-0 max-w-full items-baseline justify-center whitespace-normal sm:whitespace-nowrap">
                            <span className="font-sans text-[22px] font-bold leading-none tracking-tight text-[#d56d8d] tabular-nums sm:text-[26px] md:text-[28px]">
                              {artist.caseCount.toLocaleString()}
                            </span>
                            <span className="ml-0.5 shrink-0 text-[13px] font-bold leading-none text-[#d56d8d]">件</span>
                          </div>
                          <span className="mt-0.5 text-[10px] font-medium text-gray-600">以上</span>
                        </div>
                        <Image src="/laurel-right.svg" alt="" width={18} height={44} className="shrink-0" />
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-col items-center">
                      <div className="mb-1 text-[12px] font-medium text-gray-500">指名数</div>
                      <div className="flex min-h-[62px] min-w-0 max-w-full items-center justify-center gap-0.5">
                        <Image src="/laurel-left.svg" alt="" width={18} height={44} className="shrink-0" />
                        <div className="flex min-w-0 max-w-full flex-col items-center justify-center px-0.5">
                          <div className="flex min-w-0 max-w-full flex-wrap items-baseline justify-center gap-x-0.5 sm:flex-nowrap sm:whitespace-nowrap">
                            <span className="text-[10px] font-medium text-gray-600">月間</span>
                            <span className="font-sans text-[22px] font-bold leading-none tracking-tight text-[#d56d8d] tabular-nums sm:text-[26px] md:text-[28px]">
                              120
                            </span>
                            <span className="text-[11px] font-medium text-gray-600">名</span>
                          </div>
                          <span className="mt-0.5 text-[10px] font-medium text-gray-600">以上</span>
                        </div>
                        <Image src="/laurel-right.svg" alt="" width={18} height={44} className="shrink-0" />
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-col items-center">
                      <div className="mb-1 text-[12px] font-medium text-gray-500">リピート率</div>
                      <div className="flex min-h-[62px] min-w-0 max-w-full items-center justify-center gap-0.5">
                        <Image src="/laurel-left.svg" alt="" width={18} height={44} className="shrink-0" />
                        <div className="flex min-w-0 max-w-full flex-col items-center justify-center px-0.5">
                          <div className="flex items-baseline justify-center whitespace-nowrap">
                            <span className="font-sans text-[22px] font-bold leading-none tracking-tight text-[#d56d8d] tabular-nums sm:text-[26px] md:text-[28px]">
                              92
                            </span>
                            <span className="ml-px text-[15px] font-bold leading-none text-[#d56d8d]">%</span>
                          </div>
                          <span className="mt-0.5 max-w-[5.5rem] text-[10px] font-medium leading-tight text-gray-600 sm:max-w-none">
                            (2024年実績)
                          </span>
                        </div>
                        <Image src="/laurel-right.svg" alt="" width={18} height={44} className="shrink-0" />
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 max-w-none text-[13px] leading-[1.65] text-gray-700">
                    {artist.bio || "一人ひとりの骨格や表情に合わせた、ナチュラルで上品なデザインをご提案します。初めての方にも安心してお任せいただけるよう丁寧にご案内します。"}
                  </p>
                </div>
              </div>
            </section>

          </div>

          <aside className="order-2 flex min-w-0 flex-col gap-3.5 lg:order-0 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 lg:self-start lg:gap-4">
            <section className="order-2 rounded-[20px] border border-[#efe7e9] bg-white p-4 text-center shadow-[0_8px_30px_rgba(17,24,39,0.03)] sm:p-5 lg:order-1">
              <h2 className="font-serif text-[19px] font-medium text-[#d56d8d]">無料カウンセリング<span className="border-b-[1.5px] border-[#d56d8d] pb-0.5">予約</span></h2>
              <p className="mt-2.5 text-[12px] leading-snug text-gray-700">{artist.displayName} さんの施術を受けたい方はこちら</p>
                <Link
                  href={`/booking/${artist.id}`}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#d56d8d] to-[#c2185b] px-3 py-3 text-[13px] font-bold leading-tight text-white shadow-[0_8px_20px_rgba(194,24,91,0.2)] transition-all duration-300 hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_10px_25px_rgba(194,24,91,0.3)]"
                >
                <Calendar className="h-4 w-4 shrink-0" />
                空き状況を確認して予約する
              </Link>
              <Link href={`/booking/${artist.id}?type=consultation`} className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#e8ced7] px-3 py-2.5 text-[12px] font-bold leading-snug text-gray-700 hover:bg-[#fff7fa]">
                <MessageCircle className="h-3.5 w-3.5 shrink-0 text-[#d56d8d]" />無料カウンセリングを相談する
              </Link>
              <button type="button" className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-[10px] border border-[#e8ced7] px-3 py-2.5 text-[12px] font-bold leading-snug text-gray-700 hover:bg-[#fff7fa]">
                <Heart className="h-3.5 w-3.5 shrink-0 text-[#d56d8d]" />お気に入りに追加する
              </button>
              <p className="mt-2.5 text-center text-[11px] text-gray-500"><span className="text-[12px] font-bold text-[#d56d8d]">{favoriteCount}人</span>がお気に入りに登録中</p>
            </section>

            <section className="order-1 rounded-[20px] border border-[#efe7e9] bg-white p-4 shadow-[0_8px_30px_rgba(17,24,39,0.03)] sm:p-4 sm:pb-5 lg:order-2">
              <h3 className="text-[16px] font-bold text-gray-900">基本情報</h3>
              <table className="mt-4 w-full border-collapse text-left text-[12px] leading-snug">
                <tbody>
                  <tr>
                    <th scope="row" className="w-[1%] border-b border-[#f4edf0] py-3 pe-2 align-top font-normal whitespace-nowrap text-gray-500">
                      在籍クリニック
                    </th>
                    <td className="min-w-0 border-b border-[#f4edf0] py-3 ps-2 align-top font-medium break-keep text-gray-900">
                      <span className="whitespace-normal sm:whitespace-nowrap">{artist.clinicName || "未登録"}</span>
                      {artist.clinicAddress && <><br /><span className="text-xs text-gray-500">{artist.clinicAddress}</span></>}
                    </td>
                  </tr>
                  {artist.businessHours && (
                    <tr>
                      <th scope="row" className="w-[1%] border-b border-[#f4edf0] py-3 pe-2 align-top font-normal whitespace-nowrap text-gray-500">営業時間</th>
                      <td className="border-b border-[#f4edf0] py-3 ps-2 align-top font-medium text-gray-900">{artist.businessHours}</td>
                    </tr>
                  )}
                  <tr>
                    <th scope="row" className="w-[1%] border-b border-[#f4edf0] py-3 pe-2 align-top font-normal whitespace-nowrap text-gray-500">経験年数</th>
                    <td className="border-b border-[#f4edf0] py-3 ps-2 align-top font-medium text-gray-900">{artist.yearsOfExperience ? `${artist.yearsOfExperience}年` : "未登録"}</td>
                  </tr>
                  <tr>
                    <th scope="row" className="w-[1%] border-b border-[#f4edf0] py-3 pe-2 align-top font-normal whitespace-nowrap text-gray-500">施術歴</th>
                    <td className="border-b border-[#f4edf0] py-3 ps-2 align-top font-medium text-gray-900">{artist.caseCount.toLocaleString()}件</td>
                  </tr>
                  <tr>
                    <th scope="row" className="w-[1%] border-b border-[#f4edf0] py-3 pe-2 align-top font-normal whitespace-nowrap text-gray-500">得意なデザイン</th>
                    <td className="min-w-0 border-b border-[#f4edf0] py-3 ps-2 align-top font-medium break-keep text-gray-900">
                      ナチュラル / 平行眉<br />
                      ふんわり眉 / 韓国風リップ
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="w-[1%] border-b border-[#f4edf0] py-3 pe-2 align-top font-normal whitespace-nowrap text-gray-500">資格・所属学会</th>
                    <td className="min-w-0 border-b border-[#f4edf0] py-3 ps-2 align-top font-medium break-keep text-gray-900">
                      <span className="whitespace-normal sm:whitespace-nowrap">日本アートメイク協会 正会員</span>
                      <br />
                      国際アートメイク学会 会員
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className="w-[1%] border-b border-[#f4edf0] py-3 pe-2 align-top font-normal whitespace-nowrap text-gray-500">出身地</th>
                    <td className="border-b border-[#f4edf0] py-3 ps-2 align-top font-medium text-gray-900">東京都</td>
                  </tr>
                  <tr>
                    <th scope="row" className="w-[1%] py-3 pe-2 align-top font-normal whitespace-nowrap text-gray-500">対応エリア</th>
                    <td className="min-w-0 py-3 ps-2 align-top font-medium text-gray-900">
                      <span className="whitespace-normal sm:whitespace-nowrap">東京都 ・ 神奈川県 ・ 千葉県</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="order-3 rounded-[20px] border border-[#efe7e9] bg-white p-4 shadow-[0_8px_30px_rgba(17,24,39,0.03)] sm:p-5 lg:order-3">
              <h3 className="text-[15px] font-bold text-[#d56d8d]">このアーティストの特徴</h3>
              <ul className="mt-4 space-y-2.5 text-[13px] font-medium text-gray-700">
                <li className="flex items-center gap-2.5">
                  <Heart className="h-4 w-4 shrink-0 text-[#d56d8d]" />
                  <span>丁寧なカウンセリング</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Heart className="h-4 w-4 shrink-0 text-[#d56d8d]" />
                  <span>ナチュラルな仕上がり</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Heart className="h-4 w-4 shrink-0 text-[#d56d8d]" />
                  <span>似合わせデザイン提案力</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Heart className="h-4 w-4 shrink-0 text-[#d56d8d]" />
                  <span>ダウンタイムが少ない施術</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Heart className="h-4 w-4 shrink-0 text-[#d56d8d]" />
                  <span>リピート率が高い</span>
                </li>
              </ul>
            </section>

            <section className="order-4 rounded-[20px] border border-[#efe7e9] bg-white p-4 shadow-[0_8px_30px_rgba(17,24,39,0.03)] sm:p-4 lg:order-4">
              <h3 className="text-[15px] font-semibold text-gray-900">このページをシェアする</h3>
              <div className="mt-3 flex min-w-0 items-start justify-between gap-1.5 text-center text-[10px] font-medium text-gray-500">
                <button type="button" className="group flex flex-1 flex-col items-center gap-1.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eee2e7] bg-white text-[#06C755] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-[#06C755] group-hover:bg-[#06C755] group-hover:text-white group-hover:shadow-lg group-hover:shadow-green-100">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M24 10.304c0-5.231-5.381-9.486-12-9.486S0 5.073 0 10.304c0 4.689 4.274 8.604 10.051 9.351.391.084.923.258 1.058.592.121.303.079.778.039 1.084l-.171 1.025c-.051.304-.247 1.191 1.066.65 1.312-.541 7.065-4.161 9.634-7.13.201-.225.405-.453.593-.685C23.284 14.15 24 12.316 24 10.304zm-15.659 2.502h-2.12a.394.394 0 01-.394-.394V8.408a.394.394 0 01.394-.394h.394a.394.394 0 01.394.394v3.214h1.332a.394.394 0 01.394.394v.396a.394.394 0 01-.394.394zm3.011 0h-.394a.394.394 0 01-.394-.394V8.408a.394.394 0 01.394-.394h.394a.394.394 0 01.394.394v4.004a.394.394 0 01-.394.394zm5.556 0h-.394a.394.394 0 01-.394-.394V9.658L14.73 12.41a.394.394 0 01-.368.204h-.359a.393.393 0 01-.394-.394V8.408a.394.394 0 01.394-.394h.394a.394.394 0 01.394.394v1.844l1.392-1.844a.394.394 0 01.368-.204h.359a.394.394 0 01.394.394v4.004a.394.394 0 01-.394.394zm4.49 0h-2.121a.394.394 0 01-.394-.394V8.408a.394.394 0 01.394-.394h2.121a.394.394 0 01.394.394v.396a.394.394 0 01-.394.394h-1.333v.81h1.333a.394.394 0 01.394.394v.396a.394.394 0 01-.394.394h-1.333v.81h1.333a.394.394 0 01.394.394v.396a.394.394 0 01-.394.394z" />
                    </svg>
                  </span>
                  <span className="group-hover:text-gray-900 transition-colors">LINE</span>
                </button>
                <button type="button" className="group flex flex-1 flex-col items-center gap-1.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eee2e7] bg-white text-black shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-black group-hover:bg-black group-hover:text-white group-hover:shadow-lg group-hover:shadow-gray-200">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </span>
                  <span className="group-hover:text-gray-900 transition-colors">X</span>
                </button>
                <button type="button" className="group flex flex-1 flex-col items-center gap-1.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eee2e7] bg-white text-[#E4405F] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-[#E4405F] group-hover:bg-gradient-to-tr group-hover:from-[#f9ce34] group-hover:via-[#ee2a7b] group-hover:to-[#6228d7] group-hover:text-white group-hover:shadow-lg group-hover:shadow-pink-100">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.668-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </span>
                  <span className="group-hover:text-gray-900 transition-colors">Instagram</span>
                </button>
                <button type="button" className="group flex flex-1 flex-col items-center gap-1.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eee2e7] bg-white text-[#6f7682] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-[#d56d8d] group-hover:bg-[#d56d8d] group-hover:text-white group-hover:shadow-lg group-hover:shadow-pink-100">
                    <Link2 className="h-4 w-4" />
                  </span>
                  <span className="group-hover:text-gray-900 transition-colors">リンクコピー</span>
                </button>
              </div>
            </section>

            <section className="order-5 overflow-hidden rounded-[20px] border border-[#efe7e9] bg-white shadow-[0_8px_30px_rgba(17,24,39,0.03)] lg:order-5">
              <div className="relative bg-gradient-to-br from-[#fff5f8] to-[#fdecef] px-4 pb-3 pt-4 sm:px-5">
                <div className="relative z-10 max-w-[9.5rem]">
                  <p className="text-[15px] font-medium leading-snug text-[#b24670]">迷ったらまずは相談</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-gray-700">
                    どのアーティストが自分に合うか無料でご提案します。
                  </p>
                </div>
                
                <div className="absolute bottom-0 right-0 top-0 w-[120px] overflow-hidden">
                  <Image 
                    src="/demo/clinic_staff_model.png" 
                    alt="相談イメージ" 
                    fill 
                    className="object-cover object-top translate-x-2" 
                    sizes="120px" 
                   unoptimized={true} />
                </div>

                <div className="relative z-10 mt-4 flex justify-center">
                  <Link href={`/booking/${artist.id}?type=consultation`} className="inline-flex items-center justify-center gap-1.5 rounded-[6px] bg-white px-4 py-1.5 text-[11px] font-medium text-black shadow-sm transition-all duration-300 hover:shadow-md hover:brightness-[0.98]">
                    無料カウンセリングを相談する <span className="text-[12px] font-normal">&gt;</span>
                  </Link>
                </div>
              </div>
            </section>
          </aside>

          <div className="order-3 min-w-0 space-y-5 lg:order-0 lg:col-start-1 lg:row-start-2 lg:space-y-6">

            <section className="min-w-0 overflow-hidden rounded-[20px] border border-[#efe7e9] bg-white p-4 shadow-[0_8px_30px_rgba(17,24,39,0.03)] sm:p-5">
              <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                <h2 className="text-[22px] font-semibold tracking-tight text-gray-900">症例写真</h2>
                <Link href="/cases" className="text-sm font-medium text-[#a14f71] hover:underline">すべての症例を見る</Link>
              </div>

              <div className="mb-6 flex min-w-0 gap-1.5 overflow-x-auto pb-2 [touch-action:pan-x_pan-y] [scrollbar-width:none] md:gap-2 [&::-webkit-scrollbar]:hidden">
                {["眉", "リップ", "アイライン", "ヘアライン", "SMP", "ほくろ"].map((t, idx) => (
                  <button
                    key={t}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 md:px-5 md:py-2 md:text-sm ${
                      idx === 0 
                        ? "bg-[#d56d8d] text-white shadow-md shadow-pink-100" 
                        : "bg-white text-gray-600 border border-[#eee2e7] hover:border-[#d56d8d] hover:text-[#d56d8d]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {hasCases ? (
                <div className="relative">
                  <div className="mb-2 flex justify-between text-gray-400 sm:hidden">
                    <button aria-label="前の症例" className="rounded-full border border-[#eee2e7] p-2">‹</button>
                    <button aria-label="次の症例" className="rounded-full border border-[#eee2e7] p-2">›</button>
                  </div>
                  <div className="flex min-w-0 gap-3 overflow-x-auto pb-3 [touch-action:pan-x_pan-y] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:gap-3.5">
                    {topCases.slice(0, 3).map((c) => (
                      <article key={c.id} className="group w-[252px] shrink-0 overflow-hidden rounded-[16px] border border-[#f0e9eb] bg-white shadow-[0_4px_14px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:w-[268px] lg:w-[254px]">
                        <div className="grid grid-cols-2 gap-px bg-[#f3ebee]">
                        <div className="relative aspect-square overflow-hidden bg-gray-100">
                          <Image src={c.beforeImgUrl} alt={`${c.title} before`} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 180px"  unoptimized={true} />
                          <span className="absolute left-2 top-2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white">Before</span>
                        </div>
                        <div className="relative aspect-square overflow-hidden bg-gray-100">
                          <Image src={c.afterImgUrl} alt={`${c.title} after`} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 180px"  unoptimized={true} />
                          <span className="absolute left-2 top-2 rounded bg-[#c2185b]/80 px-2 py-0.5 text-[10px] text-white">After</span>
                        </div>
                        </div>
                        <div className="p-3">
                          <h3 className="line-clamp-1 text-[14px] font-medium text-gray-900 transition-colors group-hover:text-[#d56d8d]">{c.title}</h3>
                          <p className="mt-1 line-clamp-1 text-xs text-gray-500">{c.category.name}{c.technique ? ` / ${c.technique.name}` : ""}</p>
                          <div className="mt-3 flex items-center justify-end text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5 text-[#d86c92] transition-transform group-hover:scale-125" />{90 + Number(c.id) % 40}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
                  公開中の症例写真がありません
                </div>
              )}
            </section>

            <section className="min-w-0 overflow-hidden rounded-[20px] border border-[#efe7e9] bg-white p-4 shadow-[0_8px_30px_rgba(17,24,39,0.03)] sm:p-5 md:p-6">
              <div className="mb-5 flex min-w-0 flex-wrap items-center justify-between gap-2">
                <h2 className="text-[20px] font-bold tracking-tight text-gray-900">施術メニュー・料金</h2>
                <Link href={`/booking/${artist.id}`} className="text-[13px] font-medium text-gray-500 hover:underline">すべてのメニューを見る &gt;</Link>
              </div>

              <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(200px,248px)] lg:gap-6">
                <div className="space-y-0 divide-y divide-[#f3eaed] border-t border-[#f3eaed]">
                  {artist.menus.length > 0 ? (
                    artist.menus.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-start justify-between gap-4 py-4 lg:py-[1.125rem]">
                        <div className="min-w-0">
                          <h3 className="text-[14px] font-bold text-gray-900">{m.name}</h3>
                          {m.description && (
                            <p className="mt-1 text-[12px] leading-snug text-gray-500">{m.description}</p>
                          )}
                          <div className="mt-1.5 flex items-center gap-1 text-[12px] text-gray-400">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{m.durationMin}分</span>
                          </div>
                        </div>
                        <div className="shrink-0 text-[15px] font-bold tabular-nums text-[#b24670]">
                          {formatYen(m.price)} <span className="text-[11px] font-medium text-gray-400">(税込)</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-10 text-center text-sm text-gray-500">公開中のメニューがありません</div>
                  )}
                  <div className="pt-4">
                    <p className="text-[11px] leading-relaxed text-gray-400">
                      ※カウンセリング料別途 &nbsp; ※料金はクリニックにより異なる場合があります
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center rounded-[16px] border border-[#f5ebef] bg-[#fdf8fa] p-5 text-center sm:p-6">
                  <h3 className="text-[14px] font-bold text-[#d56d8d]">初めての方も安心</h3>
                  <ul className="mt-4 space-y-3 text-[13px] font-medium leading-snug text-gray-600">
                    <li>丁寧なカウンセリング</li>
                    <li>医療機関での安心施術</li>
                    <li>アフターケアサポート付き</li>
                  </ul>
                  <Link
                    href={`/booking/${artist.id}`}
                    className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-[#e0d0d6] bg-white px-3 py-2 text-[12px] font-bold text-gray-600 shadow-sm hover:bg-gray-50"
                  >
                    空き状況を確認する &gt;
                  </Link>
                </div>
              </div>
            </section>

            <section
              id="reviews"
              className="min-w-0 overflow-hidden rounded-[20px] border border-[#efe7e9] bg-white px-4 py-4 shadow-[0_8px_30px_rgba(17,24,39,0.03)] sm:p-5 sm:py-6"
            >
              <div className="mb-5 flex items-center justify-between gap-3 px-0.5">
                <h2 className="text-[20px] font-bold tracking-tight text-gray-900">口コミ ({reviewCount}件)</h2>
                <button type="button" className="shrink-0 text-[12px] font-medium text-gray-500 hover:underline">すべての口コミを見る &gt;</button>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(156px,176px)_minmax(0,1fr)] lg:gap-6">
                <div className="mx-3 sm:mx-6 lg:mx-0 rounded-[16px] border border-[#f5ebef] bg-white p-3.5 sm:p-4 lg:p-4">
                  <div className="text-center">
                    <p className="text-[11px] font-medium text-gray-500">総合評価</p>
                    <p className="mt-1 text-[30px] font-bold leading-none text-[#b24670]">{avgRating.toFixed(1)}</p>
                    <div className="mt-2 flex justify-center text-[#f3af4a]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  <div className="mt-5 space-y-2">
                    {artist.ratingDistribution.map((row) => {
                      const percentage = reviewCount > 0 ? Math.round((row.c / reviewCount) * 100) : 0;
                      return (
                        <div key={row.s} className="flex items-center gap-2 text-[10px] text-gray-400">
                          <span className="w-2 shrink-0 tabular-nums">{row.s}</span>
                          <Star className="h-2.5 w-2.5 shrink-0 fill-current text-[#f3af4a]" />
                          <div className="h-1 min-w-0 flex-1 rounded-full bg-[#f8f1f3]">
                            <div className="h-full rounded-full bg-[#f3af4a]" style={{ width: `${percentage}%` }}></div>
                          </div>
                          <span className="min-w-[2.75rem] shrink-0 text-right tabular-nums text-gray-500">{row.c}件</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {reviewCards.length > 0 ? (
                  <div className="grid mx-3 grid-cols-1 gap-3 sm:mx-6 sm:grid-cols-2 lg:mx-0">
                    {reviewCards.slice(0, 2).map((r) => (
                      <article key={r.id} className="group flex min-w-0 flex-col rounded-[16px] border border-[#f0e9eb] bg-white p-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-100 bg-gray-100">
                            <Image src={r.avatar} alt="" fill className="object-cover"  unoptimized={true} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate whitespace-nowrap text-[12px] font-bold text-gray-900">{r.name}</p>
                            <div className="mt-0.5 flex items-center gap-1 text-[#b24670]">
                              <div className="flex text-[#b24670]">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-2.5 w-2.5 ${i < Math.floor(r.rating) ? 'fill-current' : 'text-gray-200'}`} />
                                ))}
                              </div>
                              <span className="ml-1 text-[11px] font-bold">{r.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className="inline-block rounded-full bg-[#fdf2f5] px-2.5 py-0.5 text-[10px] font-bold text-[#d56d8d]">
                            {r.label}
                          </span>
                        </div>
                        <p className="mt-3 flex-1 text-[12px] font-medium leading-relaxed text-gray-700">{r.body}</p>
                        <p className="mt-3 text-[10px] text-gray-400">{r.date}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[160px] items-center justify-center rounded-[16px] border border-dashed border-gray-200 bg-gray-50 mx-3 sm:mx-6 lg:mx-0">
                    <p className="text-[13px] font-medium text-gray-500">まだ口コミはありません</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  className="inline-flex w-auto max-w-full items-center justify-center gap-2 rounded-xl border border-[#d56d8d] bg-white px-6 py-3 text-[13px] font-bold text-[#d56d8d] hover:bg-[#fff5f8] lg:w-full lg:max-w-[260px] lg:px-6 lg:py-2"
                >
                  すべての口コミを見る &gt;
                </button>
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
