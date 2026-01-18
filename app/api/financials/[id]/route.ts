import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { calculateCommission } from "@/lib/utils";

// Get single financial record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const financial = await prisma.financial.findUnique({
      where: { id },
      include: {
        lead: {
          include: {
            doctor: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!financial) {
      return NextResponse.json({ error: "Financial record not found" }, { status: 404 });
    }

    return NextResponse.json({ financial });
  } catch (error) {
    console.error("Error fetching financial record:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching financial record" },
      { status: 500 }
    );
  }
}

// Update financial record
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      rentalAmount,
      shippingCost,
      otherExpenses,
      gstAmount,
      paymentStatus,
      paymentReceivedDate,
    } = body;

    const financial = await prisma.financial.findUnique({
      where: { id },
      include: {
        lead: {
          include: {
            doctor: true,
          },
        },
      },
    });

    if (!financial) {
      return NextResponse.json({ error: "Financial record not found" }, { status: 404 });
    }

    const updateData: any = {};

    // If amounts are being changed, recalculate commission and profit
    if (
      rentalAmount !== undefined ||
      shippingCost !== undefined ||
      gstAmount !== undefined ||
      otherExpenses !== undefined
    ) {
      const newRentalAmount = rentalAmount !== undefined ? rentalAmount : financial.rentalAmount;
      const newShipping = shippingCost !== undefined ? shippingCost : financial.shippingCost;
      const newGst = gstAmount !== undefined ? gstAmount : financial.gstAmount;
      const newOtherExpenses = otherExpenses !== undefined ? otherExpenses : financial.otherExpenses;

      const otherExpensesTotal = Array.isArray(newOtherExpenses)
        ? newOtherExpenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
        : 0;

      const result = calculateCommission(
        newRentalAmount,
        financial.commissionRateApplied,
        newShipping,
        newGst,
        otherExpensesTotal
      );

      updateData.rentalAmount = newRentalAmount;
      updateData.shippingCost = newShipping;
      updateData.gstAmount = newGst;
      updateData.otherExpenses = newOtherExpenses;
      updateData.baseAmount = result.baseAmount;
      updateData.doctorCommission = result.commission;
      updateData.netProfit = result.netProfit;
    }

    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus as PaymentStatus;
    }

    if (paymentReceivedDate !== undefined) {
      updateData.paymentReceivedDate = paymentReceivedDate ? new Date(paymentReceivedDate) : null;
    }

    const updatedFinancial = await prisma.financial.update({
      where: { id },
      data: updateData,
      include: {
        lead: {
          include: {
            doctor: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      financial: updatedFinancial,
    });
  } catch (error) {
    console.error("Error updating financial record:", error);
    return NextResponse.json(
      { error: "An error occurred while updating financial record" },
      { status: 500 }
    );
  }
}
