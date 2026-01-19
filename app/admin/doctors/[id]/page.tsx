import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DoctorEditForm } from "@/components/forms/DoctorEditForm";

export default async function DoctorDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
    redirect("/admin/login");
  }

  const { id } = await params;

  // Fetch doctor directly from database
  const doctorData = await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
      leads: {
        include: {
          financial: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      payouts: {
        orderBy: {
          createdAt: "desc",
        },
      },
      commissionHistory: {
        orderBy: {
          effectiveDate: "desc",
        },
        take: 10,
      },
    },
  });

  if (!doctorData) {
    redirect("/admin/doctors");
  }

  // Calculate statistics
  const totalLeads = doctorData.leads.length;
  const completedLeads = doctorData.leads.filter(
    (lead) => lead.status === "COMPLETED" || lead.status === "PAYMENT_RECEIVED"
  ).length;
  const activeLeads = doctorData.leads.filter(
    (lead) => lead.status === "ACTIVE_RENTAL" || lead.status === "EQUIPMENT_SHIPPED"
  ).length;

  // Calculate total commission earned from all closed leads
  const totalCommission = doctorData.leads.reduce((sum, lead) => {
    if (lead.financial && lead.financial.doctorCommission) {
      return sum + lead.financial.doctorCommission;
    }
    return sum;
  }, 0);

  // Calculate total payouts received (PAID status only)
  const totalPayoutsReceived = doctorData.payouts
    .filter((payout) => payout.status === "PAID")
    .reduce((sum, payout) => sum + payout.amount, 0);

  // Calculate pending commission
  const pendingCommission = totalCommission - totalPayoutsReceived;

  const stats = {
    totalLeads,
    completedLeads,
    activeLeads,
    totalCommission,
    totalPayoutsReceived,
    pendingCommission,
  };

  const doctor = {
    ...doctorData,
    stats,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{doctor.user.name}</h1>
          <p className="text-gray-500 mt-1">{doctor.user.email}</p>
        </div>
        <Link href="/admin/doctors">
          <Button variant="outline">Back to List</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{doctor.stats.totalLeads}</div>
            <div className="text-sm text-gray-500">Total Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{doctor.stats.activeLeads}</div>
            <div className="text-sm text-gray-500">Active Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{doctor.stats.completedLeads}</div>
            <div className="text-sm text-gray-500">Completed Leads</div>
          </CardContent>
        </Card>
      </div>

      {/* Commission & Payout Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Commission & Payout Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium mb-1">Total Commission Earned</div>
              <div className="text-3xl font-bold text-blue-900">
                {formatCurrency(doctor.stats.totalCommission)}
              </div>
              <div className="text-xs text-blue-600 mt-2">
                From {doctor.stats.completedLeads} completed leads
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium mb-1">Payouts Received</div>
              <div className="text-3xl font-bold text-green-900">
                {formatCurrency(doctor.stats.totalPayoutsReceived)}
              </div>
              <div className="text-xs text-green-600 mt-2">
                {doctorData.payouts.filter(p => p.status === "PAID").length} payouts completed
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="text-sm text-orange-600 font-medium mb-1">Pending Commission</div>
              <div className="text-3xl font-bold text-orange-900">
                {formatCurrency(doctor.stats.pendingCommission)}
              </div>
              <div className="text-xs text-orange-600 mt-2">
                Awaiting payout
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Doctor Information */}
      <Card>
        <CardHeader>
          <CardTitle>Doctor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500">Name</label>
              <p className="font-medium text-gray-900">{doctor.user.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="font-medium text-gray-900">{doctor.user.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Commission Rate</label>
              <p className="font-medium text-green-600">{doctor.commissionRate}%</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Clinic Name</label>
              <p className="font-medium text-gray-900">{doctor.clinicName || "-"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Phone</label>
              <p className="font-medium text-gray-900">{doctor.phone || "-"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">City</label>
              <p className="font-medium text-gray-900">{doctor.city || "-"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Joined</label>
              <p className="font-medium text-gray-900">{formatDate(doctor.user.createdAt)}</p>
            </div>
          </div>
          {doctor.notes && (
            <div className="mt-4">
              <label className="text-sm text-gray-500">Notes</label>
              <p className="mt-1 text-gray-700">{doctor.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Doctor (Super Admin only) */}
      {session.user.role === "SUPER_ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            <DoctorEditForm doctor={doctor} />
          </CardContent>
        </Card>
      )}

      {/* Commission History */}
      {doctor.commissionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Commission Rate History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {doctor.commissionHistory.map((history: any) => (
                <div
                  key={history.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {history.oldRate}% → {history.newRate}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{history.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatDate(history.effectiveDate)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Payouts */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Payout History</CardTitle>
            <Link href={`/admin/payouts?doctor=${doctor.id}`}>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {doctorData.payouts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No payouts yet</p>
          ) : (
            <div className="space-y-3">
              {doctorData.payouts.slice(0, 5).map((payout: any) => (
                <div
                  key={payout.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {formatCurrency(payout.amount)}
                        </p>
                        <StatusBadge status={payout.status} />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Period: {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Created: {formatDate(payout.createdAt)}
                      </p>
                      {payout.notes && (
                        <p className="text-xs text-gray-600 mt-2 italic">{payout.notes}</p>
                      )}
                    </div>
                    <Link href={`/admin/payouts/${payout.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Leads</CardTitle>
            <Link href={`/admin/leads?doctor=${doctor.id}`}>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {doctor.leads.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No leads yet</p>
          ) : (
            <div className="space-y-3">
              {doctor.leads.slice(0, 10).map((lead: any) => (
                <div
                  key={lead.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{lead.patientName}</p>
                        <StatusBadge status={lead.status} />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{lead.patientPhone}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Submitted: {formatDate(lead.submissionDate)}
                      </p>
                      {lead.financial && (
                        <p className="text-sm text-green-600 mt-2 font-medium">
                          Commission: {formatCurrency(lead.financial.doctorCommission)}
                        </p>
                      )}
                    </div>
                    <Link href={`/admin/leads/${lead.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
