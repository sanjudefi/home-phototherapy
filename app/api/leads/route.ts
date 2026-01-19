import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";

// Create new lead (Doctor only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "DOCTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.doctorId) {
      return NextResponse.json({ error: "Doctor profile not found" }, { status: 400 });
    }

    const body = await request.json();
    const { patientName, parentName, parentEmail, patientPhone, patientLocation, city, notes } = body;

    // Validate required fields
    if (!patientName || !parentName || !parentEmail || !patientPhone || !patientLocation || !city) {
      return NextResponse.json(
        { error: "Baby name, parent name, parent email, phone, location, and city are required" },
        { status: 400 }
      );
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        patientName,
        parentName,
        parentEmail,
        patientPhone,
        patientLocation,
        city,
        notes: notes || null,
        doctorId: session.user.doctorId,
        status: LeadStatus.NEW_LEAD,
      },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
      },
    });

    // TODO: Send notification to admin about new lead

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        patientName: lead.patientName,
        status: lead.status,
        submissionDate: lead.submissionDate,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the lead" },
      { status: 500 }
    );
  }
}

// Get leads (Doctor: their own, Admin: all)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let leads;

    if (session.user.role === "DOCTOR") {
      // Doctor sees only their own leads
      if (!session.user.doctorId) {
        return NextResponse.json({ error: "Doctor profile not found" }, { status: 400 });
      }

      leads = await prisma.lead.findMany({
        where: {
          doctorId: session.user.doctorId,
          ...(status && { status: status as LeadStatus }),
        },
        orderBy: { submissionDate: "desc" },
        include: {
          assignedEquipment: true,
          financial: true,
        },
      });
    } else if (session.user.role === "SUPER_ADMIN" || session.user.role === "SUB_ADMIN") {
      // Admin sees all leads
      leads = await prisma.lead.findMany({
        where: {
          ...(status && { status: status as LeadStatus }),
        },
        orderBy: { submissionDate: "desc" },
        include: {
          doctor: {
            include: {
              user: true,
            },
          },
          assignedEquipment: true,
          financial: true,
        },
      });
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching leads" },
      { status: 500 }
    );
  }
}
