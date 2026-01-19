import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Get all doctors
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can view doctors list
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: any = {};

    if (search) {
      where.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          clinicName: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            status: true,
          },
        },
        _count: {
          select: {
            leads: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform to include status at doctor level for easier access
    const transformedDoctors = doctors.map(doctor => ({
      ...doctor,
      status: doctor.status || doctor.user.status,
    }));

    return NextResponse.json({ doctors: transformedDoctors });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching doctors" },
      { status: 500 }
    );
  }
}

// Create new doctor (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      email,
      password,
      clinicName,
      phone,
      city,
      specialization,
      commissionRate,
    } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and doctor in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone: phone || "",
          passwordHash: hashedPassword,
          role: "DOCTOR",
        },
      });

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          clinicName: clinicName || null,
          phone: phone || null,
          city: city || null,
          specialization: specialization || null,
          commissionRate: commissionRate ? parseFloat(commissionRate) : 0,
        },
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

      // Create initial commission history if rate is set
      if (commissionRate && parseFloat(commissionRate) > 0) {
        await tx.commissionHistory.create({
          data: {
            doctorId: doctor.id,
            oldRate: 0,
            newRate: parseFloat(commissionRate),
            effectiveDate: new Date(),
            changedBy: session.user.id,
            reason: "Initial commission rate set by admin",
          },
        });
      }

      return doctor;
    });

    return NextResponse.json({
      success: true,
      doctor: result,
      message: "Doctor created successfully",
    });
  } catch (error) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      { error: "An error occurred while creating doctor" },
      { status: 500 }
    );
  }
}
