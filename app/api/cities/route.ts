import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get all cities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const cities = await prisma.city.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ cities });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching cities" },
      { status: 500 }
    );
  }
}

// Create new city (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    const body = await request.json();
    const { name, state } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "City name is required" },
        { status: 400 }
      );
    }

    // Check if city already exists
    const existingCity = await prisma.city.findUnique({
      where: { name },
    });

    if (existingCity) {
      return NextResponse.json(
        { error: "A city with this name already exists" },
        { status: 400 }
      );
    }

    const city = await prisma.city.create({
      data: {
        name,
        state: state || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      city,
      message: "City created successfully",
    });
  } catch (error) {
    console.error("Error creating city:", error);
    return NextResponse.json(
      { error: "An error occurred while creating city" },
      { status: 500 }
    );
  }
}
