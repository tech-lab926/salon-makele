import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BookingFlow from "@/components/booking/BookingFlow";
import { StripeWrapper } from "@/components/payment/StripeWrapper";
import EmptyState from "@/components/ui/EmptyState";
import { SEO_SITE_NAME_JA } from "@/lib/seo-copy";
import { getPublishedArtistDetailById } from "@/lib/artist-public-detail";

interface Props {
  params: Promise<{ artistId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/** Deduped via `getPublishedArtistDetailById` (`React.cache`) across metadata + page. */
async function loadPublishedArtistForBooking(artistId: string) {
  const artist = await getPublishedArtistDetailById(artistId);
  if (!artist) return null;
  return {
    id: artist.id,
    displayName: artist.displayName,
    profileImgUrl: artist.profileImgUrl,
    area: {
      id: artist.area.id,
      prefecture: artist.area.prefecture,
      city: artist.area.city,
    },
    menus: artist.menus.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      price: m.price,
      durationMin: m.durationMin,
      category: m.category,
    })),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { artistId } = await params;
  const artist = await loadPublishedArtistForBooking(artistId);
  if (!artist) {
    return { title: "アーティストが見つかりません", robots: { index: false, follow: true } };
  }
  const title = `${artist.displayName}の予約`;
  const description = `${artist.displayName}（${artist.area.prefecture}）の空き状況を確認し、メニューを選んで予約申し込み。${SEO_SITE_NAME_JA}は決済なしの簡単予約です。`;
  return {
    title,
    description,
    keywords: [artist.displayName, artist.area.prefecture, "予約", "アートメイク", SEO_SITE_NAME_JA],
    alternates: { canonical: `/booking/${artistId}` },
    openGraph: {
      title: `${title} | ${SEO_SITE_NAME_JA}`,
      description,
      url: `/booking/${artistId}`,
      locale: "ja_JP",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SEO_SITE_NAME_JA}`,
      description,
    },
  };
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { artistId } = await params;
  const sParams = await searchParams;
  const defaultMenuId = typeof sParams?.menuId === "string" ? sParams.menuId : undefined;
  const defaultDate = typeof sParams?.date === "string" ? sParams.date : undefined;
  const defaultSlotId = typeof sParams?.slotId === "string" ? sParams.slotId : undefined;

  const rescheduleBookingId = typeof sParams?.rescheduleBookingId === "string" ? sParams.rescheduleBookingId : undefined;

  const artist = await loadPublishedArtistForBooking(artistId);

  if (!artist) notFound();

  const { getAuthUser } = await import("@/lib/auth");
  const user = await getAuthUser();
  const isLoggedInUser = Boolean(user && user.role === "user");

  const serializedArtist = {
    id: artist.id.toString(),
    displayName: artist.displayName,
    profileImgUrl: artist.profileImgUrl,
    area: artist.area.prefecture,
  };

  const isConsultation = sParams?.type === "consultation";

  let serializedMenus = artist.menus.map(
    (m: {
      id: string;
      name: string;
      price: number | null;
      durationMin: number;
      category: { name: string };
    }) => ({
    id: m.id.toString(),
    name: m.name,
    price: m.price,
    durationMin: m.durationMin,
    categoryName: m.category.name,
  }));

  if (isConsultation) {
    serializedMenus = [
      {
        id: "consultation_30",
        name: "無料カウンセリング (30分)",
        price: 0,
        durationMin: 30,
        categoryName: "相談",
      },
      {
        id: "consultation_60",
        name: "無料カウンセリング (60分)",
        price: 0,
        durationMin: 60,
        categoryName: "相談",
      }
    ];
  }

  if (serializedMenus.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <EmptyState
          title="現在このアーティストは予約メニューを登録していません"
          description="メニューが登録され次第、こちらから予約できるようになります。"
          actionLabel="アーティストページへ"
          actionHref={`/artists/${artist.id.toString()}`}
        />
      </div>
    );
  }

  return (
    <StripeWrapper>
      <BookingFlow 
        artist={serializedArtist} 
        menus={serializedMenus} 
        defaultMenuId={defaultMenuId} 
        defaultDate={defaultDate}
        defaultSlotId={defaultSlotId}
        isLoggedInUser={isLoggedInUser}
        rescheduleBookingId={rescheduleBookingId}
      />
    </StripeWrapper>
  );
}
