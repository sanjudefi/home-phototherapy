import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { LeadStatus, EquipmentStatus, PaymentStatus } from "@prisma/client";

export default async function AdminDashboard() {
  const session = await auth();

  // Fetch dashboard statistics
  const [
    totalLeads,
    activeRentals,
    totalDoctors,
    availableEquipment,
    pendingPayouts,
    thisMonthRevenue,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({
      where: { status: LeadStatus.ACTIVE_RENTAL },
    }),
    prisma.doctor.count({
      where: { status: "ACTIVE" },
    }),
    prisma.equipment.count({
      where: { status: EquipmentStatus.AVAILABLE },
    }),
    prisma.payout.aggregate({
      where: { status: PaymentStatus.PENDING },
      _sum: { totalAmount: true },
    }),
    prisma.financial.aggregate({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { rentalAmount: true },
    }),
  ]);

  // Fetch recent leads
  const recentLeads = await prisma.lead.findMany({
    take: 5,
    orderBy: { submissionDate: "desc" },
    include: {
      doctor: {
        include: { user: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user.name}
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your phototherapy business today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Leads"
          value={totalLeads}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />

        <StatsCard
          title="Active Rentals"
          value={activeRentals}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatsCard
          title="Available Equipment"
          value={availableEquipment}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />

        <StatsCard
          title="Pending Payouts"
          value={formatCurrency(pendingPayouts._sum.totalAmount || 0)}
          icon={
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Month Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>This Month's Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              {formatCurrency(thisMonthRevenue._sum.rentalAmount || 0)}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Total revenue from {new Date().toLocaleString('default', { month: 'long' })}
            </p>
          </CardContent>
        </Card>

        {/* Total Doctors */}
        <Card>
          <CardHeader>
            <CardTitle>Active Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{totalDoctors}</div>
            <p className="text-sm text-gray-600 mt-2">
              Doctors actively referring patients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No leads yet. Waiting for doctors to submit patient referrals.
            </div>
          ) : (
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{lead.patientName}</p>
                    <p className="text-sm text-gray-600">
                      Referred by Dr. {lead.doctor.user.name} • {lead.patientLocation}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      lead.status === LeadStatus.NEW_LEAD ? 'bg-blue-100 text-blue-800' :
                      lead.status === LeadStatus.ACTIVE_RENTAL ? 'bg-green-100 text-green-800' :
                      lead.status === LeadStatus.COMPLETED ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {lead.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(lead.submissionDate).toLocaleDateString()}
                    </span>
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
