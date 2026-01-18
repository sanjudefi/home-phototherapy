import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role, UserStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, city, specialization } = body;

    // Validate required fields
    if (!name || !email || !password || !phone || !city) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and doctor in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          phone,
          city,
          role: Role.DOCTOR,
          status: UserStatus.ACTIVE,
        },
      });

      // Create doctor profile with default commission rate of 0%
      // Admin will set the actual rate later
      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          specialization: specialization || null,
          commissionRate: 0, // Default rate, to be set by admin
          status: UserStatus.ACTIVE,
        },
      });

      return { user, doctor };
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        userId: result.user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
