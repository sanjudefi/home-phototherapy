import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get all payouts
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const doctorId = searchParams.get("doctorId");

    // Doctors can only see their own payouts
    const isDoctor = session.user.role === "DOCTOR";
    const isAdmin = session.user.role === "SUPER_ADMIN" || session.user.role === "SUB_ADMIN";

    if (!isDoctor && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const where: any = {};

    if (isDoctor) {
      where.doctorId = session.user.doctorId;
    } else if (doctorId && doctorId !== "ALL") {
      where.doctorId = doctorId;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const payouts = await prisma.payout.findMany({
      where,
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        processedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate totals
    const totals = payouts.reduce(
      (acc, payout) => ({
        totalAmount: acc.totalAmount + payout.amount,
        pending: acc.pending + (payout.status === "PENDING" ? payout.amount : 0),
        paid: acc.paid + (payout.status === "PAID" ? payout.amount : 0),
      }),
      { totalAmount: 0, pending: 0, paid: 0 }
    );

    return NextResponse.json({ payouts, totals });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching payouts" },
      { status: 500 }
    );
  }
}

// Create payout (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    const body = await request.json();
    const {
      doctorId,
      amount,
      periodStart,
      periodEnd,
      notes,
    } = body;

    // Validate required fields
    if (!doctorId || !amount || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Doctor ID, amount, and period dates are required" },
        { status: 400 }
      );
    }

    const payout = await prisma.payout.create({
      data: {
        doctorId,
        amount: parseFloat(amount),
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        status: "PENDING",
        notes: notes || null,
      },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      payout,
    });
  } catch (error) {
    console.error("Error creating payout:", error);
    return NextResponse.json(
      { error: "An error occurred while creating payout" },
      { status: 500 }
    );
  }
}
