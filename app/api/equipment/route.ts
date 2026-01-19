import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EquipmentStatus } from "@prisma/client";

// Get all equipment
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can view equipment list
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const city = searchParams.get("city");

    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status as EquipmentStatus;
    }

    if (city && city !== "ALL") {
      where.currentLocationCity = city;
    }

    const equipment = await prisma.equipment.findMany({
      where,
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
        _count: {
          select: {
            rentals: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform assignedLeads array to currentLead for easier consumption
    const transformedEquipment = equipment.map((eq) => ({
      ...eq,
      currentLead: eq.assignedLeads[0] || null,
      assignedLeads: undefined,
    }));

    return NextResponse.json({ equipment: transformedEquipment });
  } catch (error) {
    console.error("Error fetching equipment:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching equipment" },
      { status: 500 }
    );
  }
}

// Create new equipment
export async function POST(request: NextRequest) {
  try {
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
      currentLocationCity,
      notes,
    } = body;

    // Validate required fields
    if (!name || !serialNumber) {
      return NextResponse.json(
        { error: "Name and serial number are required" },
        { status: 400 }
      );
    }

    // Check if serial number already exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { serialNumber },
    });

    if (existingEquipment) {
      return NextResponse.json(
        { error: "Equipment with this serial number already exists" },
        { status: 400 }
      );
    }

    const equipment = await prisma.equipment.create({
      data: {
        name,
        serialNumber,
        modelNumber: modelNumber || null,
        manufacturer: manufacturer || null,
        currentLocationCity: currentLocationCity || null,
        status: "AVAILABLE",
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      equipment,
    });
  } catch (error) {
    console.error("Error creating equipment:", error);
    return NextResponse.json(
      { error: "An error occurred while creating equipment" },
      { status: 500 }
    );
  }
}
