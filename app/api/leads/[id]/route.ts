import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";

// Get single lead details
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

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        assignedEquipment: true,
        rental: true,
        financial: true,
        patientForm: true,
        statusHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Check permissions
    if (session.user.role === "DOCTOR") {
      if (lead.doctorId !== session.user.doctorId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching lead" },
      { status: 500 }
    );
  }
}

// Update lead (Admin only)
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
    const { status, notes, assignedEquipmentId } = body;

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Update lead and create status history entry if status changed
    const updateData: any = {};

    if (status && status !== lead.status) {
      updateData.status = status as LeadStatus;

      // Create status history entry
      await prisma.leadStatusHistory.create({
        data: {
          leadId: id,
          status: status as LeadStatus,
          changedBy: session.user.id,
          comment: notes || null,
        },
      });
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (assignedEquipmentId !== undefined) {
      updateData.assignedEquipmentId = assignedEquipmentId;

      // Update equipment status if assigned
      if (assignedEquipmentId) {
        await prisma.equipment.update({
          where: { id: assignedEquipmentId },
          data: { status: "IN_USE" },
        });
      }
    }

    const updatedLead = await prisma.lead.update({
      where: { id: id },
      data: updateData,
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        assignedEquipment: true,
      },
    });

    // TODO: Send notification to doctor about status change

    return NextResponse.json({
      success: true,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "An error occurred while updating lead" },
      { status: 500 }
    );
  }
}
