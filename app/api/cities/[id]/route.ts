import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get single city
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const city = await prisma.city.findUnique({
      where: { id },
    });

    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    return NextResponse.json({ city });
  } catch (error) {
    console.error("Error fetching city:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching city" },
      { status: 500 }
    );
  }
}

// Update city
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
    const { name, state, isActive } = body;

    const city = await prisma.city.findUnique({
      where: { id },
    });

    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    // Check if name already exists (if being changed)
    if (name && name !== city.name) {
      const existingCity = await prisma.city.findUnique({
        where: { name },
      });

      if (existingCity) {
        return NextResponse.json(
          { error: "A city with this name already exists" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (state !== undefined) updateData.state = state || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCity = await prisma.city.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      city: updatedCity,
    });
  } catch (error) {
    console.error("Error updating city:", error);
    return NextResponse.json(
      { error: "An error occurred while updating city" },
      { status: 500 }
    );
  }
}

// Delete city
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

    const city = await prisma.city.findUnique({
      where: { id },
    });

    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    await prisma.city.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "City deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting city:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting city" },
      { status: 500 }
    );
  }
}
