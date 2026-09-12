import { z } from "zod";

/** Common regex for BigInt IDs (positive integers) */
export const idSchema = z.string().regex(/^\d+$/).transform(val => BigInt(val));

/** User Role Schema */
export const roleSchema = z.enum(["admin", "artist", "user"]);

/** Booking Status Schema */
export const bookingStatusSchema = z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]);

/** Artist Profile Schema */
export const artistProfileSchema = z.object({
  displayName: z.string().min(1, "表示名は必須です").max(100),
  bio: z.string().max(2000).optional(),
  areaId: z.string().regex(/^\d+$/).optional(),
  profileImgUrl: z.string().optional().or(z.literal("")),
  skillCategoryIds: z.array(z.string().regex(/^\d+$/)).optional(),
});

/** Booking Create Schema */
export const bookingCreateSchema = z.object({
  availabilityId: z.string().regex(/^\d+$/),
  menuId: z.string().regex(/^\d+$/).or(z.string().startsWith("consultation_")),
  userNote: z.string().max(1000, "メモは1000文字以内で入力してください").nullable().optional(),
  stripePaymentMethodId: z.string().min(1, "カード情報の登録が必要です").nullable().optional(),
});

/** Login Schema */
export const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上である必要があります"),
});

/** Registration Schema */
export const registerSchema = z.object({
  name: z.string().min(1, "名前は必須です").max(100),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上である必要があります"),
  role: roleSchema,
  areaId: z.string().regex(/^\d+$/).optional(),
  categoryIds: z.array(z.string().regex(/^\d+$/)).optional(),
  medicalLicenseUrl: z.string().optional(),
  artmakeDiplomaUrl: z.string().optional(),
});
