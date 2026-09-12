import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sendEmail, inquiryReceivedEmail, adminInquiryNotificationEmail } from "@/lib/email";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(1, "お名前を入力してください").max(100),
  email: z.string().email("有効なメールアドレスを入力してください"),
  subject: z.string().min(1, "件名を入力してください").max(200),
  message: z.string().min(10, "お問い合わせ内容は10文字以上で入力してください").max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(result.error.issues[0]?.message || "Validation failed", 400);
    }

    const { name, email, subject, message } = result.data;

    // Send email to user
    await sendEmail({
      to: email,
      ...inquiryReceivedEmail(name),
    });

    // Send email to admin
    const adminEmail = process.env.EMAIL_FROM || "info@makele.jp";
    await sendEmail({
      // Clean up the from address format to just the email address for "to"
      to: adminEmail.includes("<") ? adminEmail.split("<")[1].replace(">", "").trim() : adminEmail.trim(),
      ...adminInquiryNotificationEmail(name, email, subject, message),
    });

    return successResponse({ success: true, message: "お問い合わせを送信しました" });
  } catch (error) {
    console.error("Contact API Error:", error);
    return errorResponse("送信に失敗しました。時間をおいて再度お試しください。", 500);
  }
}
