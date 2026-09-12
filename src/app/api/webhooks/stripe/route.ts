import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  let body: string;
  try {
    body = await request.text();
  } catch (err) {
    return new NextResponse("Error reading request body", { status: 400 });
  }

  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing Stripe Signature", { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("❌ [STRIPE ERROR]: STRIPE_WEBHOOK_SECRET is not configured in environment variables.");
    return new NextResponse("Webhook configuration error", { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const invoiceIdStr = session.metadata?.invoiceId;

    if (invoiceIdStr && /^\d+$/.test(invoiceIdStr)) {
      const invoiceId = BigInt(invoiceIdStr);

      try {
        await prisma.$transaction(async (tx: any) => {
          // Verify if invoice exists and is not already paid
          const invoice = await tx.invoice.findUnique({
            where: { id: invoiceId },
          });

          if (invoice && invoice.status !== "PAID") {
            // Update invoice status to PAID
            await tx.invoice.update({
              where: { id: invoiceId },
              data: {
                status: "PAID",
                paidAt: new Date(),
              },
            });

            // Cascade payment to related booking fees
            await tx.bookingFee.updateMany({
              where: { invoiceId },
              data: { status: "PAID" },
            });

            console.log(`Invoice ${invoiceIdStr} successfully marked as PAID via Stripe webhook`);
          }
        });
      } catch (dbErr) {
        console.error("Failed to update invoice payment state in database:", dbErr);
        return new NextResponse("Database update failed", { status: 500 });
      }
    }
  }

  return new NextResponse("OK", { status: 200 });
}
