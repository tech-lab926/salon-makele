"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  Loader2,
  CreditCard,
} from "lucide-react";
import PaymentSection from "@/components/payment/PaymentSection";
import DefaultAvatar from "@/components/ui/DefaultAvatar";

interface ArtistData {
  id: string;
  displayName: string;
  profileImgUrl: string | null;
  area: string;
}

interface MenuData {
  id: string;
  name: string;
  price: number | null;
  durationMin: number;
  categoryName: string;
}

interface Slot {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  bookable: boolean;
}

interface Props {
  artist: ArtistData;
  menus: MenuData[];
  defaultMenuId?: string | null;
  defaultDate?: string;
  defaultSlotId?: string;
  isLoggedInUser?: boolean;
  rescheduleBookingId?: string;
}

function formatYen(price: number | null): string {
  if (price === null) return "要相談";
  return `¥${price.toLocaleString("ja-JP")}`;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { firstDay, daysInMonth };
}

function formatMonthLabel(year: number, month: number) {
  return `${year}年${month + 1}月`;
}

type Step = "date" | "menu" | "confirm" | "done";
type DayAvailability = "available" | "unavailable" | "none";

export default function BookingFlow({ 
  artist, 
  menus, 
  defaultMenuId,
  defaultDate,
  defaultSlotId,
  isLoggedInUser = false,
  rescheduleBookingId
}: Props) {
  const router = useRouter();
  const today = new Date();
  
  const initialDate = defaultDate ? new Date(defaultDate) : today;
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  
  const [slots, setSlots] = useState<Slot[]>([]);
  /** Grouped and sorted slots per date to avoid expensive O(N) filter/sort in the render loop */
  const [slotsByDate, setSlotsByDate] = useState<Record<string, Slot[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  const initialMenu = menus.find(m => m.id === defaultMenuId);
  
  // If we have defaultDate and defaultSlotId, we can skip straight to confirm step
  const initialStep = (initialMenu && defaultDate && defaultSlotId) ? "confirm" : (initialMenu ? "date" : "menu");
  
  const [step, setStep] = useState<Step>(initialStep);
  const [selectedDate, setSelectedDate] = useState<string | null>(defaultDate || null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(initialMenu ? initialMenu.id : null);
  const [userNote, setUserNote] = useState("");
  const [stripePaymentMethodId, setStripePaymentMethodId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (step === "date" || (step === "confirm" && slots.length === 0)) {
      fetchSlots();
    }
  }, [currentYear, currentMonth, step]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchSlots() {
    setLoadingSlots(true);
    const month = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
    try {
      const url = rescheduleBookingId
        ? `/api/availability?artistId=${artist.id}&month=${month}&rescheduleBookingId=${rescheduleBookingId}`
        : `/api/availability?artistId=${artist.id}&month=${month}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        const newSlots = data.data as Slot[];
        setSlots(newSlots);
        
        // Pre-group slots by date and sort them by time
        const grouped: Record<string, Slot[]> = {};
        newSlots.forEach((s) => {
          if (!grouped[s.date]) grouped[s.date] = [];
          grouped[s.date].push(s);
        });
        
        Object.keys(grouped).forEach((date) => {
          grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
        });
        
        setSlotsByDate(grouped);

        // Auto-select slot if defaultSlotId was passed in from login redirect
        if (defaultSlotId && !selectedSlot) {
          const slotToSelect = newSlots.find((s) => s.id === defaultSlotId);
          if (slotToSelect) {
            setSelectedSlot(slotToSelect);
          } else {
            setStep("date");
            setError("選択した日時は予約できなくなりました。別の日時を選択してください。");
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingSlots(false);
    }
  }

  const selectedMenuData = menus.find((m) => m.id === selectedMenu);

  /** Parse "HH:MM" to total minutes from midnight */
  function timeToMinutes(t: string): number {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + (m || 0);
  }

  /** Optimized: Uses pre-calculated slotsByDate map.
   *  Slots are 30-min intervals, so requiredSlots = ceil(durationMin / 30)
   *  and contiguity means each consecutive slot is exactly 30 min later. */
  function isSlotAccommodating(slot: Slot): boolean {
    if (!selectedMenuData || !slot.bookable) return false;
    const requiredSlots = Math.ceil(selectedMenuData.durationMin / 30);
    if (requiredSlots <= 1) return true;

    const daySlots = slotsByDate[slot.date];
    if (!daySlots) return false;

    const startIndex = daySlots.findIndex((s) => s.startTime === slot.startTime);
    if (startIndex === -1) return false;

    const slice = daySlots.slice(startIndex, startIndex + requiredSlots);
    if (slice.length < requiredSlots) return false;

    for (let i = 0; i < slice.length; i++) {
      if (!slice[i].bookable) return false;
      if (i > 0) {
        const prevMins = timeToMinutes(slice[i - 1].startTime);
        const currMins = timeToMinutes(slice[i].startTime);
        if (currMins - prevMins !== 30) return false;
      }
    }
    return true;
  }

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  const isPastMonth =
    currentYear < today.getFullYear() ||
    (currentYear === today.getFullYear() && currentMonth <= today.getMonth());

  const { firstDay, daysInMonth } = getMonthDays(currentYear, currentMonth);

  function slotsForDate(date: string) {
    return slotsByDate[date] || [];
  }

  function getDayAvailability(date: string): DayAvailability {
    const daySlots = slotsForDate(date);
    if (daySlots.length === 0) return "none";
    // Now O(M) where M is slots per day, much faster than O(N)
    return daySlots.some((slot) => isSlotAccommodating(slot)) ? "available" : "unavailable";
  }

  function handleMenuSelect(menuId: string) {
    setSelectedMenu(menuId);
    setStep("date");
  }

  function handleDateSelect(day: number) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const daySlots = slots.filter((s) => s.date === dateStr);
    if (daySlots.length === 0) return;
    
    if (!daySlots.some((s) => isSlotAccommodating(s))) return;

    setSelectedDate(dateStr);
    setSelectedSlot(null);
  }

  function handleSlotSelect(slot: Slot) {
    if (!isSlotAccommodating(slot) || !slot.id) return;
    setSelectedSlot(slot);
    setStep("confirm");
  }

  async function handleSubmit() {
    if (!selectedSlot?.id) return;
    if (!selectedMenu) {
      setError("メニューを選択してください");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const isReschedule = !!rescheduleBookingId;
      const url = isReschedule ? `/api/bookings/${rescheduleBookingId}/reschedule` : "/api/bookings";
      const body = isReschedule
        ? JSON.stringify({
            availabilityId: selectedSlot.id,
            userNote: userNote || null,
          })
        : JSON.stringify({
            availabilityId: selectedSlot.id,
            menuId: selectedMenu,
            userNote: userNote || null,
            stripePaymentMethodId,
          });

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      const data = await res.json();

      if (!data.success) {
        if (res.status === 401) {
          const redirectPath = rescheduleBookingId
            ? `/booking/${artist.id}?rescheduleBookingId=${rescheduleBookingId}`
            : `/booking/${artist.id}`;
          router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
          return;
        }
        setError(data.error || "予約に失敗しました");
        return;
      }

      setStep("done");
    } catch {
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  if (step === "done") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
        <h2 className="mt-6 text-2xl font-bold text-gray-900">
          {rescheduleBookingId ? "予約日時を変更しました" : "予約リクエストを送信しました"}
        </h2>
        <p className="mt-3 text-gray-500">
          アーティストが予約を確認次第、メールでお知らせいたします。
        </p>
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm">
          <p>
            <span className="text-gray-500">アーティスト：</span>
            <span className="font-medium">{artist.displayName}</span>
          </p>
          <p className="mt-1">
            <span className="text-gray-500">日時：</span>
            <span className="font-medium">
              {selectedDate} {selectedSlot?.startTime}〜
              {selectedSlot && selectedMenuData ? (
                () => {
                  const mins = timeToMinutes(selectedSlot.startTime) + selectedMenuData.durationMin;
                  const h = Math.floor(mins / 60);
                  const m = mins % 60;
                  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                }
              )() : selectedSlot?.endTime}
            </span>
          </p>
          {selectedMenuData && (
            <p className="mt-1">
              <span className="text-gray-500">メニュー：</span>
              <span className="font-medium">{selectedMenuData.name}</span>
            </p>
          )}
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/artists/${artist.id}`}
            className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            アーティストページに戻る
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-[#c2185b] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#880e4f]"
          >
            トップページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Artist Info */}
      <div className="flex items-center gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full">
          {artist.profileImgUrl ? (
            <NextImage
              src={artist.profileImgUrl}
              alt={artist.displayName}
              fill
              className="object-cover"
            />
          ) : (
            <DefaultAvatar />
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {rescheduleBookingId ? `${artist.displayName}の予約変更` : `${artist.displayName}の予約`}
          </h1>
          <p className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5" />
            {artist.area}
          </p>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="mt-6 flex items-center gap-2">
        {(
          [
            { key: "menu", label: "メニュー" },
            { key: "date", label: "日時選択" },
            { key: "confirm", label: "確認" },
          ] as const
        ).map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-6 bg-gray-200 sm:w-10" />}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                step === s.key
                  ? "bg-[#c2185b] text-white"
                  : ["date", "confirm"].indexOf(step) >= i
                    ? "bg-pink-100 text-[#c2185b]"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              <span>{i + 1}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Step: Menu Selection */}
      {step === "menu" && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">メニューを選択</h3>
            <div className="mt-4 space-y-3">
              {menus.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => handleMenuSelect(menu.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    selectedMenu === menu.id
                      ? "border-[#c2185b] bg-pink-50"
                      : "border-gray-200 hover:border-pink-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-gray-500">
                        {menu.categoryName}
                      </span>
                      <p className="font-medium text-gray-900">{menu.name}</p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        {menu.durationMin}分
                      </p>
                    </div>
                    <span className="font-bold text-[#c2185b]">
                      {formatYen(menu.price)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step: Date Selection */}
      {step === "date" && (
        <div className="mt-6 space-y-6">
          {!rescheduleBookingId && (
            <button
              onClick={() => setStep("menu")}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← メニュー選択に戻る
            </button>
          )}
          {/* Calendar */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <button
                onClick={prevMonth}
                disabled={isPastMonth}
                className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-semibold">
                {formatMonthLabel(currentYear, currentMonth)}
              </h3>
              <button
                onClick={nextMonth}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {loadingSlots ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#c2185b]" />
              </div>
            ) : (
              <div className="mt-4">
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
                  {weekDays.map((d) => (
                    <div key={d} className="py-2">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dayAvailability = getDayAvailability(dateStr);
                    const hasSlots = dayAvailability !== "none";
                    const isSelected = selectedDate === dateStr;
                    const isPast =
                      new Date(dateStr) <
                      new Date(today.toISOString().split("T")[0]);

                    return (
                      <button
                        key={day}
                        onClick={() => handleDateSelect(day)}
                        disabled={!hasSlots || isPast}
                        className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-[#c2185b] text-white"
                            : hasSlots && !isPast
                              ? dayAvailability === "available"
                                ? "text-gray-900 hover:bg-pink-50"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                              : "text-gray-300"
                        }`}
                      >
                        <div>{day}</div>
                        {hasSlots && !isPast && !isSelected && (
                          <div
                            className={`mt-0.5 text-[10px] font-semibold ${
                              dayAvailability === "available"
                                ? "text-green-600"
                                : "text-gray-400"
                            }`}
                          >
                            {dayAvailability === "available" ? "○" : "×"}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-green-600">○</span>
                    予約可能
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-gray-400">×</span>
                    予約不可
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">
                {selectedDate} の時間枠
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                ○の時間枠を選択して予約できます
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slotsForDate(selectedDate).map((slot) => {
                  const bookable = isSlotAccommodating(slot);
                  return (
                    <button
                      key={slot.id ?? `taken-${slot.date}-${slot.startTime}`}
                      type="button"
                      onClick={() => handleSlotSelect(slot)}
                      disabled={!bookable}
                      className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                        slot.id && selectedSlot?.id === slot.id
                          ? "border-[#c2185b] bg-pink-50 text-[#c2185b]"
                          : bookable
                            ? "border-gray-200 text-gray-700 hover:border-pink-200 hover:bg-pink-50"
                            : "border-gray-200 bg-gray-50 text-gray-400"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={bookable ? "text-green-600" : "text-gray-400"}
                        >
                          {bookable ? "○" : "×"}
                        </span>
                        <span>
                          {slot.startTime}〜
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step: Confirmation */}
      {step === "confirm" && (
        <div className="mt-6 space-y-4">
          <button
            onClick={() => setStep("date")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 日時選択に戻る
          </button>
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">予約内容の確認</h3>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-gray-500">アーティスト</span>
                <span className="font-medium">{artist.displayName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-gray-500">日時</span>
                <span className="font-medium">
                  {loadingSlots ? (
                    <span className="flex items-center gap-1 text-gray-400">
                      <Loader2 className="inline h-3 w-3 animate-spin" />
                      取得中...
                    </span>
                  ) : (
                    <>
                      {selectedDate} {selectedSlot?.startTime}〜
                      {selectedSlot && selectedMenuData ? (
                        () => {
                          const mins = timeToMinutes(selectedSlot.startTime) + selectedMenuData.durationMin;
                          const h = Math.floor(mins / 60);
                          const m = mins % 60;
                          return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                        }
                      )() : selectedSlot?.endTime}
                    </>
                  )}
                </span>
              </div>
              {selectedMenuData && (
                <>
                  <div className="flex justify-between border-b border-gray-50 pb-3">
                    <span className="text-gray-500">メニュー</span>
                    <span className="font-medium">
                      {selectedMenuData.name}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-3">
                    <span className="text-gray-500">料金</span>
                    <span className="font-bold text-[#c2185b]">
                      {formatYen(selectedMenuData.price)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">
                備考（任意）
              </label>
              <textarea
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                rows={3}
                disabled={!isLoggedInUser}
                placeholder={isLoggedInUser ? "アーティストへの質問や要望をご記入ください" : "備考を入力するにはログインが必要です"}
                className="mt-1.5 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b] disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {isLoggedInUser ? (
              <>
                {/* ── Payment section: only for paid menus ── */}
                {selectedMenuData?.price && !rescheduleBookingId ? (
                  <div className="mt-6">
                    {!stripePaymentMethodId ? (
                      <div className="space-y-4">
                        <PaymentSection
                          onPaymentMethodCreated={(id) => setStripePaymentMethodId(id)}
                          isSubmitting={submitting}
                        />
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="bg-white px-2 text-xs text-gray-500">または</span>
                          </div>
                        </div>
                        <button
                          onClick={handleSubmit}
                          disabled={submitting}
                          className="w-full flex justify-center rounded-lg border-2 border-[#c2185b] bg-white px-4 py-3 text-sm font-bold text-[#c2185b] transition-colors hover:bg-pink-50 disabled:opacity-50"
                        >
                          {submitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            "現地決済で予約を確定する（カード登録なし）"
                          )}
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between rounded-xl border border-green-100 bg-green-50 p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-sm font-bold text-gray-900">カード情報が登録されました</p>
                              <p className="text-xs text-gray-600">お支払い方法の準備が完了しました。</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStripePaymentMethodId(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 underline"
                          >
                            変更
                          </button>
                        </div>

                        {/* Confirm button: only shown AFTER card is saved */}
                        <div className="mt-6 flex items-center justify-end">
                          <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="rounded-lg bg-[#c2185b] px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#880e4f] disabled:opacity-50"
                          >
                            {submitting ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              "予約を確定する"
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* Free menu — no card needed, show confirm directly */
                  <div className="mt-6 flex items-center justify-end">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="rounded-lg bg-[#c2185b] px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#880e4f] disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "予約を確定する"
                      )}
                    </button>
                  </div>
                )}

                <p className="mt-4 text-center text-xs text-gray-400">
                  予約はアーティストの承認後に確定します。確定後、メールでお知らせいたします。
                </p>
              </>
            ) : (
              <div className="mt-8 rounded-xl border border-pink-100 bg-pink-50 p-6 text-center">
                <h4 className="text-lg font-bold text-gray-900">
                  予約を確定するにはログインが必要です
                </h4>
                <p className="mt-2 text-sm text-gray-600">
                  お手数ですが、ログインまたは会員登録を行ってから予約を確定してください。
                  <br />
                  <span className="text-xs text-gray-500">※選択したメニューと日時は保存されます</span>
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href={`/login?redirect=${encodeURIComponent(`/booking/${artist.id}?menuId=${selectedMenu}&date=${selectedDate}&slotId=${selectedSlot?.id}${rescheduleBookingId ? `&rescheduleBookingId=${rescheduleBookingId}` : ""}`)}`}
                    className="flex w-full items-center justify-center rounded-lg border border-[#c2185b] px-6 py-2.5 text-sm font-medium text-[#c2185b] transition-colors hover:bg-pink-100 sm:w-auto"
                  >
                    ログイン
                  </Link>
                  <Link
                    href={`/register?redirect=${encodeURIComponent(`/booking/${artist.id}?menuId=${selectedMenu}&date=${selectedDate}&slotId=${selectedSlot?.id}${rescheduleBookingId ? `&rescheduleBookingId=${rescheduleBookingId}` : ""}`)}`}
                    className="flex w-full items-center justify-center rounded-lg bg-[#c2185b] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#880e4f] sm:w-auto"
                  >
                    新規会員登録
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
