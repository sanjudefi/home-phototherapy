import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Update rental price
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; priceId: string }> }
) {
  try {
    const { id, priceId } = await params;
    const session = await auth();

    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pricePerDay } = body;

    if (pricePerDay === undefined) {
      return NextResponse.json(
        { error: "Price per day is required" },
        { status: 400 }
      );
    }

    // Check if rental price exists
    const existingPrice = await prisma.equipmentRentalPrice.findUnique({
      where: { id: priceId },
    });

    if (!existingPrice || existingPrice.equipmentId !== id) {
      return NextResponse.json({ error: "Rental price not found" }, { status: 404 });
    }

    // Update rental price
    const updatedPrice = await prisma.equipmentRentalPrice.update({
      where: { id: priceId },
      data: {
        pricePerDay: parseFloat(pricePerDay),
      },
      include: {
        city: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Transform for consistency
    const transformedPrice = {
      id: updatedPrice.id,
      cityId: updatedPrice.cityId,
      cityName: updatedPrice.city.name,
      pricePerDay: updatedPrice.pricePerDay,
      createdAt: updatedPrice.createdAt,
      updatedAt: updatedPrice.updatedAt,
    };

    return NextResponse.json({
      success: true,
      rentalPrice: transformedPrice,
    });
  } catch (error) {
    console.error("Error updating rental price:", error);
    return NextResponse.json(
      { error: "An error occurred while updating rental price" },
      { status: 500 }
    );
  }
}

// Delete rental price
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; priceId: string }> }
) {
  try {
    const { id, priceId } = await params;
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Super Admin only" }, { status: 401 });
    }

    // Check if rental price exists
    const existingPrice = await prisma.equipmentRentalPrice.findUnique({
      where: { id: priceId },
    });

    if (!existingPrice || existingPrice.equipmentId !== id) {
      return NextResponse.json({ error: "Rental price not found" }, { status: 404 });
    }

    // Delete rental price
    await prisma.equipmentRentalPrice.delete({
      where: { id: priceId },
    });

    return NextResponse.json({
      success: true,
      message: "Rental price deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting rental price:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting rental price" },
      { status: 500 }
    );
  }
}
