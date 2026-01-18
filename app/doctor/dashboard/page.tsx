import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { LeadStatus, PaymentStatus } from "@prisma/client";
import Link from "next/link";

export default async function DoctorDashboard() {
  const session = await auth();

  if (!session?.user.doctorId) {
    return <div>Error: Doctor profile not found</div>;
  }

  // Fetch doctor profile
  const doctor = await prisma.doctor.findUnique({
    where: { id: session.user.doctorId },
    include: { user: true },
  });

  if (!doctor) {
    return <div>Error: Doctor profile not found</div>;
  }

  // Fetch dashboard statistics
  const [
    totalLeads,
    activeLeads,
    completedLeads,
    pendingEarnings,
    thisMonthEarnings,
    allTimeEarnings,
  ] = await Promise.all([
    prisma.lead.count({
      where: { doctorId: doctor.id },
    }),
    prisma.lead.count({
      where: {
        doctorId: doctor.id,
        status: LeadStatus.ACTIVE_RENTAL,
      },
    }),
    prisma.lead.count({
      where: {
        doctorId: doctor.id,
        status: LeadStatus.COMPLETED,
      },
    }),
    prisma.financial.aggregate({
      where: {
        lead: { doctorId: doctor.id },
        paymentStatus: PaymentStatus.PENDING,
      },
      _sum: { doctorCommission: true },
    }),
    prisma.financial.aggregate({
      where: {
        lead: { doctorId: doctor.id },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { doctorCommission: true },
    }),
    prisma.financial.aggregate({
      where: {
        lead: { doctorId: doctor.id },
      },
      _sum: { doctorCommission: true },
    }),
  ]);

  // Fetch recent leads
  const recentLeads = await prisma.lead.findMany({
    where: { doctorId: doctor.id },
    take: 5,
    orderBy: { submissionDate: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, Dr. {session.user.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your referrals and earnings
          </p>
        </div>
        <Link href="/doctor/leads/new">
          <Button variant="primary">Submit New Lead</Button>
        </Link>
      </div>

      {/* Commission Rate Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-blue-900">Your Commission Rate</p>
              <p className="text-sm text-blue-800">
                You earn {doctor.commissionRate}% commission on each successful lead
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Leads"
          value={totalLeads}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />

        <StatsCard
          title="Active Leads"
          value={activeLeads}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatsCard
          title="Completed"
          value={completedLeads}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />

        <StatsCard
          title="Pending Earnings"
          value={formatCurrency(pendingEarnings._sum.doctorCommission || 0)}
          icon={
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* This Month Earnings */}
        <Card>
          <CardHeader>
            <CardTitle>This Month's Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-600">
              {formatCurrency(thisMonthEarnings._sum.doctorCommission || 0)}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Earnings from {new Date().toLocaleString('default', { month: 'long' })}
            </p>
          </CardContent>
        </Card>

        {/* All Time Earnings */}
        <Card>
          <CardHeader>
            <CardTitle>All-Time Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {formatCurrency(allTimeEarnings._sum.doctorCommission || 0)}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Total earnings since you joined
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>You haven't submitted any leads yet.</p>
              <Link href="/doctor/leads/new" className="mt-4 inline-block">
                <Button variant="primary">Submit Your First Lead</Button>
              </Link>
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
                    <p className="text-sm text-gray-600">{lead.patientLocation}</p>
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
