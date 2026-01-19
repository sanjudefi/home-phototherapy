import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get equipment statistics by city
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all rental prices with equipment and city info
    const rentalPrices = await prisma.equipmentRentalPrice.findMany({
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            modelNumber: true,
          },
        },
        city: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          city: {
            name: "asc",
          },
        },
        {
          equipment: {
            name: "asc",
          },
        },
      ],
    });

    // Group by city
    const cityStats: { [key: string]: any } = {};
    const equipmentStats: { [key: string]: any } = {};

    rentalPrices.forEach((price) => {
      const cityName = price.city.name;
      const equipmentName = price.equipment.name;
      const available = price.quantity - price.quantityInUse;

      // City stats
      if (!cityStats[cityName]) {
        cityStats[cityName] = {
          cityName,
          totalQuantity: 0,
          inUse: 0,
          available: 0,
          equipmentCount: 0,
        };
      }
      cityStats[cityName].totalQuantity += price.quantity;
      cityStats[cityName].inUse += price.quantityInUse;
      cityStats[cityName].available += available;
      cityStats[cityName].equipmentCount += 1;

      // Equipment stats
      if (!equipmentStats[equipmentName]) {
        equipmentStats[equipmentName] = {
          equipmentId: price.equipment.id,
          equipmentName,
          modelNumber: price.equipment.modelNumber || "N/A",
          totalQuantity: 0,
          inUse: 0,
          available: 0,
          cities: [],
        };
      }
      equipmentStats[equipmentName].totalQuantity += price.quantity;
      equipmentStats[equipmentName].inUse += price.quantityInUse;
      equipmentStats[equipmentName].available += available;
      equipmentStats[equipmentName].cities.push({
        cityName,
        quantity: price.quantity,
        inUse: price.quantityInUse,
        available,
      });
    });

    return NextResponse.json({
      cityStats: Object.values(cityStats),
      equipmentStats: Object.values(equipmentStats),
      totalStats: {
        totalEquipment: Object.keys(equipmentStats).length,
        totalCities: Object.keys(cityStats).length,
        totalQuantity: Object.values(cityStats).reduce((sum: number, city: any) => sum + city.totalQuantity, 0),
        totalInUse: Object.values(cityStats).reduce((sum: number, city: any) => sum + city.inUse, 0),
        totalAvailable: Object.values(cityStats).reduce((sum: number, city: any) => sum + city.available, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching equipment stats:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching equipment statistics" },
      { status: 500 }
    );
  }
}
