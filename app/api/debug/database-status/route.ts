import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Debug endpoint to check database status
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Allow access only to super admin
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check table counts
    const [
      usersCount,
      doctorsCount,
      leadsCount,
      equipmentCount,
      financialsCount,
      payoutsCount,
      citiesCount,
      users,
      doctors,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.doctor.count(),
      prisma.lead.count(),
      prisma.equipment.count(),
      prisma.financial.count(),
      prisma.payout.count(),
      prisma.city.count().catch(() => 0), // City table might not exist yet
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
        take: 5,
      }),
      prisma.doctor.findMany({
        select: {
          id: true,
          userId: true,
          status: true,
          createdAt: true,
        },
        take: 5,
      }),
    ]);

    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: "Connected",
      tables: {
        users: usersCount,
        doctors: doctorsCount,
        leads: leadsCount,
        equipment: equipmentCount,
        financials: financialsCount,
        payouts: payoutsCount,
        cities: citiesCount,
      },
      sampleData: {
        users,
        doctors,
      },
      sessionInfo: {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
      },
    });
  } catch (error: any) {
    console.error("Database status check error:", error);
    return NextResponse.json(
      {
        error: "Database check failed",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
