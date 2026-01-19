import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { LeadStatusUpdate } from "@/components/forms/LeadStatusUpdate";

export default async function AdminLeadDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
    redirect("/admin/login");
  }

  // Fetch lead details
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
        take: 10,
      },
    },
  });

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Lead Not Found</h1>
        <p className="text-gray-600 mt-2">The lead you're looking for doesn't exist.</p>
        <Link href="/admin/leads" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Back to Leads
        </Link>
      </div>
    );
  }

  // Fetch available equipment for assignment
  const availableEquipment = await prisma.equipment.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link href="/admin/leads" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back to Leads
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Lead Details</h1>
          <p className="text-gray-600 mt-1">Manage and track this patient lead</p>
        </div>
        <StatusBadge status={lead.status} className="text-lg px-4 py-2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Patient Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-semibold">{lead.patientName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{lead.patientPhone}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Location/Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{lead.patientLocation}</dd>
                </div>
                {lead.notes && (
                  <div className="md:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900">{lead.notes}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Doctor Information */}
          <Card>
            <CardHeader>
              <CardTitle>Referring Doctor</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Doctor Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-semibold">{lead.doctor.user.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{lead.doctor.user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{lead.doctor.user.phone}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Commission Rate</dt>
                  <dd className="mt-1 text-sm text-gray-900">{lead.doctor.commissionRate}%</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Equipment Assignment */}
          {lead.assignedEquipment && (
            <Card>
              <CardHeader>
                <CardTitle>Assigned Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Equipment Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{lead.assignedEquipment.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Model Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">{lead.assignedEquipment.modelNumber || "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <StatusBadge status={lead.assignedEquipment.status} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{lead.assignedEquipment.equipmentType}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Financial Information */}
          {lead.financial && (
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Rental Amount</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(lead.financial.rentalAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Shipping Cost</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatCurrency(lead.financial.shippingCost)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">GST Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatCurrency(lead.financial.gstAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Base Amount</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatCurrency(lead.financial.baseAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Doctor Commission ({lead.financial.commissionRateApplied}%)</dt>
                    <dd className="mt-1 text-lg font-semibold text-green-600">{formatCurrency(lead.financial.doctorCommission)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Net Profit</dt>
                    <dd className="mt-1 text-lg font-semibold text-blue-600">{formatCurrency(lead.financial.netProfit)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.statusHistory.length === 0 ? (
                <p className="text-sm text-gray-600">No status changes yet.</p>
              ) : (
                <div className="space-y-4">
                  {lead.statusHistory.map((history) => (
                    <div key={history.id} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={history.status} />
                        <span className="text-xs text-gray-500">{formatDateTime(history.changedAt)}</span>
                      </div>
                      {history.comment && (
                        <p className="text-sm text-gray-600 mt-1">{history.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Update Status */}
          <Card>
            <CardHeader>
              <CardTitle>Update Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadStatusUpdate
                leadId={lead.id}
                currentStatus={lead.status}
                currentEquipmentId={lead.assignedEquipmentId}
                availableEquipment={availableEquipment}
                leadCity={lead.city}
              />
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-gray-500">Lead ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{lead.id.substring(0, 8)}...</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Submitted</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDateTime(lead.submissionDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDateTime(lead.updatedAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
