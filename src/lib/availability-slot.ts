/**
 * Booking grid: REQUIREMENTS §8.2 multi-slot blocking assumes fixed 1-hour bookable units
 * (e.g. 14:00–15:00, 15:00–16:00). Menus use duration_min in minutes; blocking uses
 * consecutive hourly slots after the primary slot.
 */

export const BOOKING_SLOT_DURATION_MINUTES = 30;

/** Minutes since midnight from a Prisma @db.Time Date (UTC time-of-day component). */
export function timeDateToMinutes(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

export function normalizeTimeInput(raw: string): string | null {
  const s = raw.trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  const sec = m[3] !== undefined ? Number(m[3]) : 0;
  if (
    !Number.isFinite(h) ||
    !Number.isFinite(min) ||
    h < 0 ||
    h > 23 ||
    min < 0 ||
    min > 59 ||
    sec !== 0
  ) {
    return null;
  }
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Slot must be exactly one hour; end after start same calendar day. */
export function validateHourlySlotShape(startTime: string, endTime: string): {
  ok: true;
  start: string;
  end: string;
} | { ok: false; message: string } {
  const s = normalizeTimeInput(startTime);
  const e = normalizeTimeInput(endTime);
  if (!s || !e) {
    return {
      ok: false,
      message:
        "開始・終了時刻は HH:mm 形式（例 14:00）で、秒は指定できません",
    };
  }
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  const startM = sh * 60 + sm;
  const endM = eh * 60 + em;
  if (endM <= startM) {
    return { ok: false, message: "終了時刻は開始時刻より後である必要があります" };
  }
  if (endM - startM !== BOOKING_SLOT_DURATION_MINUTES) {
    return {
      ok: false,
      message: `各枠は${BOOKING_SLOT_DURATION_MINUTES}分単位（例 14:00〜15:00）である必要があります`,
    };
  }
  return { ok: true, start: s, end: e };
}

export function prismaTimeFromHm(hm: string): Date {
  return new Date(`1970-01-01T${hm}:00Z`);
}

/** Verify adjacent rows are consecutive hours after main slot start. */
export function assertContiguousHourlyChain(
  mainStart: Date,
  orderedAdjacentStarts: Date[],
): void {
  let expected = timeDateToMinutes(mainStart) + BOOKING_SLOT_DURATION_MINUTES;
  for (const st of orderedAdjacentStarts) {
    const got = timeDateToMinutes(st);
    if (got !== expected) {
      throw new Error("NON_CONTIGUOUS_SLOTS");
    }
    expected += BOOKING_SLOT_DURATION_MINUTES;
  }
}

/** YYYY-MM-DD in Asia/Tokyo for "today" (for DATE column filters). */
export function tokyoCalendarYmd(d: Date = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

export function utcMidnightDateFromYmd(ymd: string): Date {
  const [y, m, day] = ymd.split("-").map(Number);
  if (!y || !m || !day) return new Date(NaN);
  return new Date(Date.UTC(y, m - 1, day));
}

/** When `month` query is omitted, APIs use Tokyo-local current calendar month (bounded). */
export function defaultTokyoCalendarMonthUtcBounds(now: Date = new Date()) {
  const ymd = tokyoCalendarYmd(now);
  const [y, m] = ymd.split("-").map(Number);
  return calendarMonthUtcBounds(y, m);
}

/** Safety cap per availability GET (many slots/day × weeks could otherwise grow without bound). */
export const AVAILABILITY_QUERY_MAX_ROWS = 2500;

/** Inclusive calendar month bounds for explicit YYYY-MM (Gregorian, for DB DATE filters). */
export function calendarMonthUtcBounds(year: number, month: number): {
  start: Date;
  end: Date;
} {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = utcMidnightDateFromYmd(`${year}-${pad(month)}-01`);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = utcMidnightDateFromYmd(`${year}-${pad(month)}-${pad(lastDay)}`);
  return { start, end };
}
