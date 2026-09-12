import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { renderToStream } from "@react-pdf/renderer";
import React from "react";
import InvoicePDF from "@/components/admin/invoices/InvoicePDF";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return errorResponse("Invalid invoice ID", 400);
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: BigInt(id) },
      include: {
        artist: { select: { displayName: true } },
      },
    });

    if (!invoice) {
      return errorResponse("Invoice not found", 404);
    }

    const serialized = {
      id: invoice.id.toString(),
      artistName: invoice.artist.displayName,
      periodStart: invoice.periodStart.toISOString().split("T")[0],
      periodEnd: invoice.periodEnd.toISOString().split("T")[0],
      listingFee: invoice.listingFee,
      totalBookingFees: invoice.totalBookingFees,
      totalAmount: invoice.totalAmount,
      status: invoice.status,
    };

    // Render the PDF component to a stream
    const stream = await renderToStream(
      React.createElement(InvoicePDF, { invoice: serialized }) as any
    );

    // Convert the stream to a readable stream for Next.js response
    // @ts-ignore - node stream to web stream conversion
    const responseStream = new ReadableStream({
      async start(controller) {
        stream.on("data", (chunk: any) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err: any) => controller.error(err));
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice_${serialized.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation error:", error);
    return errorResponse("Internal server error", 500);
  }
}
