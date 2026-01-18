import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EquipmentStatus } from "@prisma/client";

// Get single equipment details
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

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        assignedLeads: {
          where: {
            status: {
              in: ["EQUIPMENT_SHIPPED", "ACTIVE_RENTAL"],
            },
          },
          include: {
            doctor: {
              include: {
                user: true,
              },
            },
          },
          take: 1,
        },
        rentals: {
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
            startDatetime: "desc",
          },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // Transform for easier consumption
    const transformedEquipment = {
      ...equipment,
      currentLead: equipment.assignedLeads[0] || null,
      rentalHistory: equipment.rentals,
      assignedLeads: undefined,
      rentals: undefined,
    };

    return NextResponse.json({ equipment: transformedEquipment });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching equipment" },
      { status: 500 }
    );
  }
}

// Update equipment
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
      name,
      serialNumber,
      modelNumber,
      manufacturer,
      purchaseDate,
      purchaseCost,
      currentLocationCity,
      status,
      notes,
    } = body;

    const equipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // If serial number is being changed, check if new serial number already exists
    if (serialNumber && serialNumber !== equipment.serialNumber) {
      const existingEquipment = await prisma.equipment.findUnique({
        where: { serialNumber },
      });

      if (existingEquipment) {
        return NextResponse.json(
          { error: "Equipment with this serial number already exists" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
    if (modelNumber !== undefined) updateData.modelNumber = modelNumber || null;
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer || null;
    if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    if (purchaseCost !== undefined) updateData.purchaseCost = purchaseCost ? parseFloat(purchaseCost) : null;
    if (currentLocationCity !== undefined) updateData.currentLocationCity = currentLocationCity || null;
    if (status !== undefined) updateData.status = status as EquipmentStatus;
    if (notes !== undefined) updateData.notes = notes || null;

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: updateData,
      include: {
        assignedLeads: {
          where: {
            status: {
              in: ["EQUIPMENT_SHIPPED", "ACTIVE_RENTAL"],
            },
          },
          include: {
            doctor: {
              include: {
                user: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    // Transform for easier consumption
    const transformedEquipment = {
      ...updatedEquipment,
      currentLead: updatedEquipment.assignedLeads[0] || null,
      assignedLeads: undefined,
    };

    return NextResponse.json({
      success: true,
      equipment: transformedEquipment,
    });
  } catch (error) {
    console.error("Error updating equipment:", error);
    return NextResponse.json(
      { error: "An error occurred while updating equipment" },
      { status: 500 }
    );
  }
}

// Delete equipment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Super Admin only" }, { status: 401 });
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        assignedLeads: {
          where: {
            status: {
              in: ["EQUIPMENT_SHIPPED", "ACTIVE_RENTAL"],
            },
          },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // Check if equipment is currently in use
    if (equipment.status === "IN_USE" && equipment.assignedLeads.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete equipment that is currently in use" },
        { status: 400 }
      );
    }

    // Delete equipment (cascading will handle related records)
    await prisma.equipment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Equipment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting equipment" },
      { status: 500 }
    );
  }
}
