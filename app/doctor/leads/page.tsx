import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function DoctorLeads() {
  const session = await auth();

  if (!session || !session.user.doctorId) {
    redirect("/doctor/login");
  }

  // Fetch doctor's leads
  const leads = await prisma.lead.findMany({
    where: { doctorId: session.user.doctorId },
    orderBy: { submissionDate: "desc" },
    include: {
      financial: true,
      assignedEquipment: true,
    },
  });

  // Calculate stats
  const stats = {
    total: leads.length,
    active: leads.filter(l => l.status === "ACTIVE_RENTAL").length,
    completed: leads.filter(l => l.status === "COMPLETED").length,
    pending: leads.filter(l => ["NEW_LEAD", "CONTACTED", "EQUIPMENT_SHIPPED"].includes(l.status)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Leads</h1>
          <p className="text-gray-600 mt-1">Track all your patient referrals</p>
        </div>
        <Link href="/doctor/leads/new">
          <Button variant="primary">+ Submit New Lead</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600 mt-1">Active Rentals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-sm text-gray-600 mt-1">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">📋</div>
              <p className="text-gray-600 mb-4">You haven't submitted any leads yet.</p>
              <Link href="/doctor/leads/new">
                <Button variant="primary">Submit Your First Lead</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{lead.patientName}</h3>
                        <StatusBadge status={lead.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Phone:</span> {lead.patientPhone}
                        </div>
                        <div>
                          <span className="font-medium">Submitted:</span> {formatDate(lead.submissionDate)}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Location:</span> {lead.patientLocation}
                        </div>
                        {lead.assignedEquipment && (
                          <div>
                            <span className="font-medium">Equipment:</span> {lead.assignedEquipment.name}
                          </div>
                        )}
                        {lead.financial && (
                          <div>
                            <span className="font-medium">Your Commission:</span>{" "}
                            <span className="text-green-600 font-semibold">
                              {formatCurrency(lead.financial.doctorCommission)}
                            </span>
                          </div>
                        )}
                      </div>
                      {lead.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {lead.notes}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <Link href={`/doctor/leads/${lead.id}`}>
                        <Button variant="ghost" size="sm">View Details →</Button>
                      </Link>
                    </div>
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
