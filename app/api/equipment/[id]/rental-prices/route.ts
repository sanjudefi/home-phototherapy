import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get rental prices for an equipment
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

    const rentalPrices = await prisma.equipmentRentalPrice.findMany({
      where: { equipmentId: id },
      include: {
        city: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        city: {
          name: "asc",
        },
      },
    });

    // Transform for easier consumption
    const transformedPrices = rentalPrices.map((price) => ({
      id: price.id,
      cityId: price.cityId,
      cityName: price.city.name,
      pricePerDay: price.pricePerDay,
      createdAt: price.createdAt,
      updatedAt: price.updatedAt,
    }));

    return NextResponse.json({ rentalPrices: transformedPrices });
  } catch (error) {
    console.error("Error fetching rental prices:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching rental prices" },
      { status: 500 }
    );
  }
}

// Create new rental price for an equipment
export async function POST(
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
    const { cityId, pricePerDay } = body;

    // Validate required fields
    if (!cityId || pricePerDay === undefined) {
      return NextResponse.json(
        { error: "City ID and price per day are required" },
        { status: 400 }
      );
    }

    // Check if equipment exists
    const equipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
    }

    // Check if city exists
    const city = await prisma.city.findUnique({
      where: { id: cityId },
    });

    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    // Check if price already exists for this equipment-city combination
    const existingPrice = await prisma.equipmentRentalPrice.findUnique({
      where: {
        equipmentId_cityId: {
          equipmentId: id,
          cityId: cityId,
        },
      },
    });

    if (existingPrice) {
      return NextResponse.json(
        { error: "Rental price already exists for this city" },
        { status: 400 }
      );
    }

    // Create rental price
    const rentalPrice = await prisma.equipmentRentalPrice.create({
      data: {
        equipmentId: id,
        cityId,
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
      id: rentalPrice.id,
      cityId: rentalPrice.cityId,
      cityName: rentalPrice.city.name,
      pricePerDay: rentalPrice.pricePerDay,
      createdAt: rentalPrice.createdAt,
      updatedAt: rentalPrice.updatedAt,
    };

    return NextResponse.json({
      success: true,
      rentalPrice: transformedPrice,
    });
  } catch (error) {
    console.error("Error creating rental price:", error);
    return NextResponse.json(
      { error: "An error occurred while creating rental price" },
      { status: 500 }
    );
  }
}
