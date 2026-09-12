export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SearchParams {
  categoryId?: string;
  areaId?: string;
  keyword?: string;
  page?: string;
  limit?: string;
}

export interface BookingFormData {
  availabilityId: string;
  menuId?: string;
  userNote?: string;
}

export type AvailabilitySlotStatus = "available" | "booked" | "blocked";

export type BookingStatusType = "pending" | "confirmed" | "cancelled" | "completed";
