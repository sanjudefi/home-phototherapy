import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get single doctor details
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

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        leads: {
          include: {
            financial: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        commissionHistory: {
          orderBy: {
            effectiveDate: "desc",
          },
          take: 10,
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Calculate statistics
    const totalLeads = doctor.leads.length;
    const completedLeads = doctor.leads.filter(
      (lead) => lead.status === "COMPLETED"
    ).length;
    const activeLeads = doctor.leads.filter(
      (lead) => lead.status === "ACTIVE_RENTAL" || lead.status === "EQUIPMENT_SHIPPED"
    ).length;

    // Calculate total earnings
    const totalEarnings = doctor.leads.reduce((sum, lead) => {
      if (lead.financial && lead.financial.doctorCommission) {
        return sum + lead.financial.doctorCommission;
      }
      return sum;
    }, 0);

    const stats = {
      totalLeads,
      completedLeads,
      activeLeads,
      totalEarnings,
    };

    return NextResponse.json({
      doctor: {
        ...doctor,
        stats,
      }
    });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching doctor" },
      { status: 500 }
    );
  }
}

// Update doctor
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Super Admin only" }, { status: 401 });
    }

    const body = await request.json();
    const {
      commissionRate,
      clinicName,
      phone,
      city,
      notes,
    } = body;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (clinicName !== undefined) updateData.clinicName = clinicName || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (city !== undefined) updateData.city = city || null;
    if (notes !== undefined) updateData.notes = notes || null;

    // If commission rate is being changed, create a history record
    if (commissionRate !== undefined && commissionRate !== doctor.commissionRate) {
      const newRate = parseFloat(commissionRate);

      // Create commission history record
      await prisma.commissionHistory.create({
        data: {
          doctorId: id,
          oldRate: doctor.commissionRate,
          newRate: newRate,
          effectiveDate: new Date(),
          changedBy: session.user.id,
          reason: `Commission rate updated from ${doctor.commissionRate}% to ${newRate}%`,
        },
      });

      updateData.commissionRate = newRate;
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error("Error updating doctor:", error);
    return NextResponse.json(
      { error: "An error occurred while updating doctor" },
      { status: 500 }
    );
  }
}
