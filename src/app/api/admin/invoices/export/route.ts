import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");
    
    const whereClause: any = {};
    if (artistId && /^\d+$/.test(artistId)) {
      whereClause.artistId = BigInt(artistId);
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        artist: { select: { displayName: true } },
      },
      orderBy: { periodStart: "desc" },
    });

    // Create CSV content
    const headers = ["Invoice ID", "Artist", "Period Start", "Period End", "Listing Fee", "Booking Fees", "Total Amount", "Status", "Issued At", "Paid At"];
    const rows = invoices.map((inv: any) => [
      inv.id.toString(),
      inv.artist.displayName,
      inv.periodStart.toISOString().split("T")[0],
      inv.periodEnd.toISOString().split("T")[0],
      inv.listingFee,
      inv.totalBookingFees,
      inv.totalAmount,
      inv.status,
      inv.issuedAt?.toISOString() || "",
      inv.paidAt?.toISOString() || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="invoices_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV Export error:", error);
    return errorResponse("Internal server error", 500);
  }
}
