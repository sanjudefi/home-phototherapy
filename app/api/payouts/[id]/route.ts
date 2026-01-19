import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

// Get single payout
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

    const payout = await prisma.payout.findUnique({
      where: { id },
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
    });

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    // Doctors can only see their own payouts
    if (session.user.role === "DOCTOR" && payout.doctorId !== session.user.doctorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ payout });
  } catch (error) {
    console.error("Error fetching payout:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching payout" },
      { status: 500 }
    );
  }
}

// Update payout (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    const body = await request.json();
    const {
      status,
      paymentDate,
      paymentMethod,
      transactionId,
      receiptUrl,
      notes,
    } = body;

    const payout = await prisma.payout.findUnique({
      where: { id },
    });

    if (!payout) {
      return NextResponse.json({ error: "Payout not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status as PaymentStatus;

      // If marking as paid, set payment date if not provided
      if (status === "PAID" && !paymentDate && !payout.paymentDate) {
        updateData.paymentDate = new Date();
      }

      // Track who processed it
      if (status === "PAID" && !payout.processedById) {
        updateData.processedById = session.user.id;
      }
    }

    if (paymentDate !== undefined) {
      updateData.paymentDate = paymentDate ? new Date(paymentDate) : null;
    }

    if (paymentMethod !== undefined) {
      updateData.paymentMethod = paymentMethod || null;
    }

    if (transactionId !== undefined) {
      updateData.transactionId = transactionId || null;
    }

    if (receiptUrl !== undefined) {
      updateData.receiptUrl = receiptUrl || null;
    }

    if (notes !== undefined) {
      updateData.notes = notes || null;
    }

    const updatedPayout = await prisma.payout.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json({
      success: true,
      payout: updatedPayout,
    });
  } catch (error) {
    console.error("Error updating payout:", error);
    return NextResponse.json(
      { error: "An error occurred while updating payout" },
      { status: 500 }
    );
  }
}
