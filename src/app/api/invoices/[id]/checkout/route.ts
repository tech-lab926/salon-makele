import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { stripe } from "@/lib/stripe";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user || user.role !== "artist") {
      return errorResponse("Unauthorized", 401);
    }

    if (!/^\d+$/.test(id)) {
      return errorResponse("Invalid invoice ID format", 400);
    }
    const invoiceId = BigInt(id);

    // Fetch invoice and verify owner
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { artist: true },
    });

    if (!invoice) {
      return errorResponse("Invoice not found", 404);
    }

    if (invoice.artist.userId !== BigInt(user.userId)) {
      return errorResponse("Forbidden", 403);
    }

    if (invoice.status === "PAID") {
      return errorResponse("This invoice has already been paid", 400);
    }

    // Set fallback domain if NEXTAUTH_URL is missing
    const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const formattedStart = invoice.periodStart.toISOString().split("T")[0];
    const formattedEnd = invoice.periodEnd.toISOString().split("T")[0];

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: `サロン掲載手数料・成約手数料 (${formattedStart} 〜 ${formattedEnd})`,
              description: `月額掲載料: ¥${invoice.listingFee.toLocaleString()} / 成約手数料: ¥${invoice.totalBookingFees.toLocaleString()}`,
            },
            unit_amount: invoice.totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        invoiceId: invoice.id.toString(),
      },
      success_url: `${origin}/artist/dashboard/invoices/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/artist/dashboard/invoices/cancel`,
    });

    return successResponse({ checkoutUrl: session.url });
  } catch (error) {
    console.error("Invoice Stripe Checkout error:", error);
    return errorResponse("Internal server error", 500);
  }
}
