import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateCommission } from "@/lib/utils";

// Get all financials
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can view financials
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};

    if (status && status !== "ALL") {
      where.paymentStatus = status;
    }

    const financials = await prisma.financial.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate totals
    const totals = financials.reduce(
      (acc, financial) => ({
        totalRevenue: acc.totalRevenue + financial.rentalAmount,
        totalExpenses: acc.totalExpenses + financial.shippingCost + financial.gstAmount,
        totalCommission: acc.totalCommission + financial.doctorCommission,
        totalProfit: acc.totalProfit + financial.netProfit,
      }),
      { totalRevenue: 0, totalExpenses: 0, totalCommission: 0, totalProfit: 0 }
    );

    return NextResponse.json({ financials, totals });
  } catch (error) {
    console.error("Error fetching financials:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching financials" },
      { status: 500 }
    );
  }
}

// Create financial record
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      leadId,
      rentalAmount,
      shippingCost,
      otherExpenses,
      gstAmount,
    } = body;

    // Validate required fields
    if (!leadId || rentalAmount === undefined) {
      return NextResponse.json(
        { error: "Lead ID and rental amount are required" },
        { status: 400 }
      );
    }

    // Check if financial record already exists for this lead
    const existingFinancial = await prisma.financial.findUnique({
      where: { leadId },
    });

    if (existingFinancial) {
      return NextResponse.json(
        { error: "Financial record already exists for this lead" },
        { status: 400 }
      );
    }

    // Get lead with doctor details
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        doctor: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Calculate commission and net profit
    const shipping = shippingCost || 0;
    const gst = gstAmount || 0;
    const otherExpensesArray = otherExpenses || [];

    const otherExpensesTotal = Array.isArray(otherExpensesArray)
      ? otherExpensesArray.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
      : 0;

    const result = calculateCommission(
      rentalAmount,
      lead.doctor.commissionRate,
      shipping,
      gst,
      otherExpensesTotal
    );

    const financial = await prisma.financial.create({
      data: {
        leadId,
        rentalAmount,
        shippingCost: shipping,
        otherExpenses: otherExpensesArray,
        gstAmount: gst,
        baseAmount: result.baseAmount,
        commissionRateApplied: lead.doctor.commissionRate,
        doctorCommission: result.commission,
        netProfit: result.netProfit,
        paymentStatus: "PENDING",
      },
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
      financial,
    });
  } catch (error) {
    console.error("Error creating financial record:", error);
    return NextResponse.json(
      { error: "An error occurred while creating financial record" },
      { status: 500 }
    );
  }
}
