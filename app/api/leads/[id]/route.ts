import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeadStatus } from "@prisma/client";

// Get single lead details
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

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        assignedEquipment: true,
        rental: true,
        financial: true,
        patientForm: true,
        statusHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Check permissions
    if (session.user.role === "DOCTOR") {
      if (lead.doctorId !== session.user.doctorId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching lead" },
      { status: 500 }
    );
  }
}

// Update lead (Admin only)
export async function PATCH(
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
    const { status, notes, assignedEquipmentId, daysUsed, shippingCost } = body;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        doctor: true,
        assignedEquipment: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Update lead and create status history entry if status changed
    const updateData: any = {};

    if (status && status !== lead.status) {
      updateData.status = status as LeadStatus;

      // Create status history entry
      await prisma.leadStatusHistory.create({
        data: {
          leadId: id,
          status: status as LeadStatus,
          changedBy: session.user.id,
          comment: notes || null,
        },
      });
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (assignedEquipmentId !== undefined) {
      // Check if equipment is being assigned (not unassigned)
      if (assignedEquipmentId && assignedEquipmentId !== lead.assignedEquipmentId) {
        // Validate that equipment is available in this city
        if (lead.city) {
          const cityRecord = await prisma.city.findFirst({
            where: { name: lead.city },
          });

          if (cityRecord) {
            const rentalPrice = await prisma.equipmentRentalPrice.findUnique({
              where: {
                equipmentId_cityId: {
                  equipmentId: assignedEquipmentId,
                  cityId: cityRecord.id,
                },
              },
            });

            if (!rentalPrice) {
              return NextResponse.json(
                { error: `Equipment not available in ${lead.city}` },
                { status: 400 }
              );
            }

            // Check if quantity is available
            if (rentalPrice.quantityInUse >= rentalPrice.quantity) {
              return NextResponse.json(
                { error: `No available units for this equipment in ${lead.city}` },
                { status: 400 }
              );
            }

            // Increment quantity in use
            await prisma.equipmentRentalPrice.update({
              where: {
                equipmentId_cityId: {
                  equipmentId: assignedEquipmentId,
                  cityId: cityRecord.id,
                },
              },
              data: {
                quantityInUse: {
                  increment: 1,
                },
              },
            });
          }
        }

        // If there was a previous equipment assigned, decrement its quantity in use
        if (lead.assignedEquipmentId && lead.city) {
          const cityRecord = await prisma.city.findFirst({
            where: { name: lead.city },
          });

          if (cityRecord) {
            const oldRentalPrice = await prisma.equipmentRentalPrice.findUnique({
              where: {
                equipmentId_cityId: {
                  equipmentId: lead.assignedEquipmentId,
                  cityId: cityRecord.id,
                },
              },
            });

            if (oldRentalPrice && oldRentalPrice.quantityInUse > 0) {
              await prisma.equipmentRentalPrice.update({
                where: {
                  equipmentId_cityId: {
                    equipmentId: lead.assignedEquipmentId,
                    cityId: cityRecord.id,
                  },
                },
                data: {
                  quantityInUse: {
                    decrement: 1,
                  },
                },
              });
            }
          }
        }
      }

      updateData.assignedEquipmentId = assignedEquipmentId;
    }

    const updatedLead = await prisma.lead.update({
      where: { id: id },
      data: updateData,
      include: {
        doctor: {
          include: {
            user: true,
          },
        },
        assignedEquipment: true,
      },
    });

    // Handle financial calculations when closing a lead
    if ((status === "COMPLETED" || status === "PAYMENT_RECEIVED") && daysUsed) {
      if (!lead.assignedEquipment) {
        return NextResponse.json(
          { error: "Cannot close lead without assigned equipment" },
          { status: 400 }
        );
      }

      if (!lead.city) {
        return NextResponse.json(
          { error: "Cannot close lead without city information" },
          { status: 400 }
        );
      }

      // Get the city ID from city name
      const city = await prisma.city.findFirst({
        where: { name: lead.city },
      });

      if (!city) {
        return NextResponse.json(
          { error: `City "${lead.city}" not found in the system` },
          { status: 404 }
        );
      }

      // Get the rental price for this equipment in this city
      const rentalPrice = await prisma.equipmentRentalPrice.findUnique({
        where: {
          equipmentId_cityId: {
            equipmentId: lead.assignedEquipment.id,
            cityId: city.id,
          },
        },
      });

      if (!rentalPrice) {
        return NextResponse.json(
          { error: `No rental price set for ${lead.assignedEquipment.name} in ${lead.city}` },
          { status: 404 }
        );
      }

      // Calculate rental amount = days × price per day
      const rentalAmount = daysUsed * rentalPrice.pricePerDay;
      const shipping = shippingCost || 0;

      // Calculate base amount (rental + shipping)
      const baseAmount = rentalAmount + shipping;

      // Calculate GST (18%)
      const gstAmount = baseAmount * 0.18;

      // Calculate doctor commission
      const doctorCommission = rentalAmount * (lead.doctor.commissionRate / 100);

      // Calculate net profit = rental - commission
      const netProfit = rentalAmount - doctorCommission;

      // Create or update rental record
      await prisma.rental.upsert({
        where: { leadId: id },
        create: {
          leadId: id,
          equipmentId: lead.assignedEquipment.id,
          startDatetime: new Date(), // Set appropriate start date if available
          daysUsed: daysUsed,
          billingIncrement: 24, // Default to 24 hours
          status: "COMPLETED",
        },
        update: {
          daysUsed: daysUsed,
          endDatetime: new Date(),
          status: "COMPLETED",
        },
      });

      // Create or update financial record
      await prisma.financial.upsert({
        where: { leadId: id },
        create: {
          leadId: id,
          rentalAmount: rentalAmount,
          shippingCost: shipping,
          gstAmount: gstAmount,
          baseAmount: baseAmount,
          commissionRateApplied: lead.doctor.commissionRate,
          doctorCommission: doctorCommission,
          netProfit: netProfit,
          paymentStatus: status === "PAYMENT_RECEIVED" ? "PAID" : "PENDING",
        },
        update: {
          rentalAmount: rentalAmount,
          shippingCost: shipping,
          gstAmount: gstAmount,
          baseAmount: baseAmount,
          commissionRateApplied: lead.doctor.commissionRate,
          doctorCommission: doctorCommission,
          netProfit: netProfit,
          paymentStatus: status === "PAYMENT_RECEIVED" ? "PAID" : "PENDING",
        },
      });

      // Decrement quantity in use when lead is completed
      if (rentalPrice.quantityInUse > 0) {
        await prisma.equipmentRentalPrice.update({
          where: {
            equipmentId_cityId: {
              equipmentId: lead.assignedEquipment.id,
              cityId: city.id,
            },
          },
          data: {
            quantityInUse: {
              decrement: 1,
            },
          },
        });
      }
    }

    // TODO: Send notification to doctor about status change

    return NextResponse.json({
      success: true,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "An error occurred while updating lead" },
      { status: 500 }
    );
  }
}
