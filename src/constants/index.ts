export const APP_NAME = "MAKELE";
export const APP_DESCRIPTION = "Japan's first medically-supervised art makeup case study & artist search platform";

export const ITEMS_PER_PAGE = 12;
/** Admin tables: default page size (max 100 in API). */
export const ADMIN_ITEMS_PER_PAGE = 50;
export const MAX_RECENT_VIEWS = 20;
export const VIEW_DEDUP_MINUTES = 30;
export const VIEW_HISTORY_RETENTION_DAYS = 30;

export const BOOKING_STATUSES = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
} as const;

export const AVAILABILITY_STATUSES = {
  AVAILABLE: "available",
  BOOKED: "booked",
  BLOCKED: "blocked",
} as const;

export const USER_ROLES = {
  USER: "user",
  ARTIST: "artist",
  ADMIN: "admin",
} as const;

export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: "booking_confirmed",
  BOOKING_CANCELLED: "booking_cancelled",
  BOOKING_COMPLETED: "booking_completed",
  NEW_BOOKING: "new_booking",
  CASE_APPROVED: "case_approved",
} as const;
