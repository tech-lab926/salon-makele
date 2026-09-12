import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { paginatedResponse, successResponse, errorResponse } from "@/lib/api-response";
import { getArtistActivePlan } from "@/lib/subscription";
import { getPageRange } from "@/lib/utils";
import { ADMIN_ITEMS_PER_PAGE } from "@/constants";

// GET: List all invoices (with basic artist details)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || ADMIN_ITEMS_PER_PAGE),
    );
    const { skip, take } = getPageRange(page, limit);

    const whereClause =
      artistId != null &&
      artistId !== "" &&
      /^\d+$/.test(artistId)
        ? { artistId: BigInt(artistId) }
        : {};

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: whereClause,
        include: {
          artist: { select: { displayName: true } },
        },
        orderBy: { periodStart: "desc" },
        skip,
        take,
      }),
      prisma.invoice.count({ where: whereClause }),
    ]);

    const serialized = invoices.map((inv: any) => ({
      id: inv.id.toString(),
      artistId: inv.artistId.toString(),
      artistName: inv.artist.displayName,
      periodStart: inv.periodStart.toISOString().split("T")[0],
      periodEnd: inv.periodEnd.toISOString().split("T")[0],
      listingFee: inv.listingFee,
      totalBookingFees: inv.totalBookingFees,
      totalAmount: inv.totalAmount,
      status: inv.status,
      issuedAt: inv.issuedAt?.toISOString() || null,
      paidAt: inv.paidAt?.toISOString() || null,
    }));

    return paginatedResponse(serialized, Number(total), page, limit);
  } catch (error) {
    console.error("Admin invoices GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// POST: Generate an invoice for an artist for a given month
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== "admin") {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { artistId, year, month } = body;

    if (!artistId || !year || !month) {
      return errorResponse("artistId, year, and month are required", 400);
    }

    const yearNum = Number(year);
    const monthNum = Number(month);

    if (!Number.isInteger(yearNum) || yearNum < 2020 || yearNum > 2100) {
      return errorResponse("Invalid year", 400);
    }
    if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
      return errorResponse("Invalid month (1–12)", 400);
    }
    if (!/^\d+$/.test(String(artistId))) {
      return errorResponse("Invalid artistId", 400);
    }

    // Determine period boundaries
    const periodStart = new Date(Date.UTC(yearNum, monthNum - 1, 1));
    const periodEnd = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));

    const idBigInt = BigInt(artistId);

    // Fetch pending fees for this artist within the period
    const pendingFees = await prisma.bookingFee.findMany({
      where: {
        artistId: idBigInt,
        status: "PENDING",
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        }
      }
    });

    // Determine current plan listing fee
    const activePlanInfo = await getArtistActivePlan(idBigInt);
    
    // If the plan is a trial, listing fee is 0, else it's the plan's monthly fee
    const listingFee = activePlanInfo.isTrial ? 0 : activePlanInfo.plan.monthlyFee;
    const totalBookingFees = pendingFees.reduce((sum: number, fee: any) => sum + fee.feeAmount, 0);
    const totalAmount = listingFee + totalBookingFees;

    const invoice = await prisma.$transaction(async (tx: any) => {
      const newInvoice = await tx.invoice.create({
        data: {
          artistId: idBigInt,
          periodStart,
          periodEnd,
          listingFee,
          totalBookingFees,
          totalAmount,
          status: "DRAFT",
        }
      });

      if (pendingFees.length > 0) {
        await tx.bookingFee.updateMany({
          where: {
            id: { in: pendingFees.map((f: any) => f.id) }
          },
          data: {
            invoiceId: newInvoice.id,
            status: "INVOICED"
          }
        });
      }

      return newInvoice;
    });

    return successResponse({
      id: invoice.id.toString(),
      totalAmount: invoice.totalAmount,
      feeCount: pendingFees.length
    }, 201);
  } catch (error) {
    console.error("Admin invoices POST error:", error);
    return errorResponse("Internal server error", 500);
  }
}
