"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2 } from "lucide-react";
import AlertModal from "@/components/ui/AlertModal";

interface Slot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  booking: { id: string; status: string; userName: string } | null;
}

const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

const timeOptions: string[] = [];
for (let h = 9; h <= 21; h++) {
  timeOptions.push(`${String(h).padStart(2, "0")}:00`);
  if (h !== 21) timeOptions.push(`${String(h).padStart(2, "0")}:30`);
}

export default function AvailabilityPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStartTime, setNewStartTime] = useState("10:00");
  const [newEndTime, setNewEndTime] = useState("11:00");
  const [saving, setSaving] = useState(false);

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "warning" | "error" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
  });

  function showAlert(title: string, message: string, type: "warning" | "error" | "info" = "warning") {
    setAlertState({ isOpen: true, title, message, type });
  }

  function closeAlert() {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  }

  useEffect(() => {
    fetchSlots();
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchSlots() {
    setLoading(true);
    const m = `${year}-${String(month + 1).padStart(2, "0")}`;
    try {
      const res = await fetch(`/api/artist/availability?month=${m}`);
      const data = await res.json();
      if (data.success) setSlots(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function slotsForDate(date: string) {
    return slots.filter((s) => s.date === date);
  }

  function dateHasSlots(date: string) {
    return slots.some((s) => s.date === date);
  }

  function isPastDate(dateStr: string) {
    return new Date(dateStr) < new Date(today.toISOString().split("T")[0]);
  }

  async function handleAddSlot() {
    if (!selectedDate) return;
    setSaving(true);

    const slotsToCreate = [];
    const [startH, startM] = newStartTime.split(":").map(Number);
    const [endH, endM] = newEndTime.split(":").map(Number);
    
    const startMins = startH * 60 + (startM || 0);
    const endMins = endH * 60 + (endM || 0);

    if (endMins <= startMins) {
      showAlert("入力エラー", "終了時間は開始時間より後に設定してください。");
      setSaving(false);
      return;
    }

    for (let m = startMins; m < endMins; m += 30) {
      const h1 = Math.floor(m / 60);
      const m1 = m % 60;
      const h2 = Math.floor((m + 30) / 60);
      const m2 = (m + 30) % 60;
      slotsToCreate.push({
        date: selectedDate,
        startTime: `${String(h1).padStart(2, "0")}:${String(m1).padStart(2, "0")}`,
        endTime: `${String(h2).padStart(2, "0")}:${String(m2).padStart(2, "0")}`,
      });
    }

    try {
      const res = await fetch("/api/artist/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slots: slotsToCreate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddForm(false);
        fetchSlots();
        if (data.data && data.data.skipped > 0) {
          if (data.data.count === 0) {
            showAlert("お知らせ", "指定された時間枠はすべて登録済みです。", "info");
          } else {
            showAlert(
              "追加完了",
              `${data.data.count}件の枠を追加しました。\n（${data.data.skipped}件は登録済みのためスキップされました）`,
              "info"
            );
          }
        }
      } else {
        showAlert("エラー", data.error || "エラーが発生しました", "error");
      }
    } catch (error) {
      console.error(error);
      showAlert("通信エラー", "通信エラーが発生しました", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSlot(id: string) {
    const res = await fetch(`/api/artist/availability/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      setSlots((prev) => prev.filter((s) => s.id !== id));
    }
  }

  const selectClass =
    "rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#c2185b] focus:ring-1 focus:ring-[#c2185b]";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">空き状況管理</h1>
      <p className="mt-1 text-sm text-gray-500">
        カレンダーから日付を選択して、空き時間を設定してください
      </p>

      {/* Calendar */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-semibold">
            {year}年{month + 1}月
          </h3>
          <button
            onClick={nextMonth}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
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
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const hasSlots = dateHasSlots(dateStr);
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setShowAddForm(false);
                    }}
                    className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-[#c2185b] text-white"
                        : hasSlots
                          ? "bg-pink-50 text-[#c2185b] hover:bg-pink-100"
                          : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Selected Date Slots */}
      {selectedDate && (
        <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{selectedDate}</h3>
            {!isPastDate(selectedDate) && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1 text-sm font-medium text-[#c2185b] hover:underline"
              >
                <Plus className="h-4 w-4" />
                時間枠を追加
              </button>
            )}
          </div>

          {showAddForm && (
            <div className="mt-4 rounded-lg border border-pink-100 bg-pink-50/50 p-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600">
                    開始時間
                  </label>
                  <select
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className={`mt-1 w-full ${selectClass}`}
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600">
                    終了時間
                  </label>
                  <select
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className={`mt-1 w-full ${selectClass}`}
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddSlot}
                disabled={saving}
                className="mt-3 w-full rounded-lg bg-[#c2185b] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#880e4f] disabled:opacity-50"
              >
                {saving ? "追加中..." : "追加"}
              </button>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {slotsForDate(selectedDate).length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                この日の空き時間はありません
              </p>
            ) : (
              slotsForDate(selectedDate).map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">
                      {slot.startTime}〜{slot.endTime}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        slot.status === "AVAILABLE"
                          ? "bg-green-50 text-green-700"
                          : slot.status === "BOOKED"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {slot.status === "AVAILABLE"
                        ? "空き"
                        : slot.status === "BOOKED"
                          ? "予約済"
                          : "ブロック"}
                    </span>
                    {slot.booking && (
                      <span className="text-xs text-gray-500">
                        {slot.booking.userName}
                      </span>
                    )}
                  </div>
                  {slot.status === "AVAILABLE" && !isPastDate(selectedDate) && (
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <AlertModal {...alertState} onClose={closeAlert} />
    </div>
  );
}
