import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { LeadStatus, EquipmentStatus, PaymentStatus } from "@prisma/client";

export default async function AdminDashboard() {
  const session = await auth();

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Fetch dashboard statistics
  const [
    totalLeads,
    activeRentals,
    completedLeads,
    newLeads,
    totalDoctors,
    availableEquipment,
    inUseEquipment,
    totalEquipment,
    pendingPayouts,
    paidPayouts,
    thisMonthFinancials,
    lastMonthFinancials,
    allTimeFinancials,
    pendingPayments,
    paidPayments,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({
      where: { status: LeadStatus.ACTIVE_RENTAL },
    }),
    prisma.lead.count({
      where: { status: LeadStatus.COMPLETED },
    }),
    prisma.lead.count({
      where: { status: LeadStatus.NEW_LEAD },
    }),
    prisma.doctor.count({
      where: { status: "ACTIVE" },
    }),
    prisma.equipment.count({
      where: { status: EquipmentStatus.AVAILABLE },
    }),
    prisma.equipment.count({
      where: { status: EquipmentStatus.IN_USE },
    }),
    prisma.equipment.count(),
    prisma.payout.aggregate({
      where: { status: PaymentStatus.PENDING },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payout.aggregate({
      where: { status: PaymentStatus.PAID },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.financial.aggregate({
      where: {
        createdAt: {
          gte: thisMonthStart,
        },
      },
      _sum: {
        rentalAmount: true,
        shippingCost: true,
        gstAmount: true,
        doctorCommission: true,
        netProfit: true,
      },
    }),
    prisma.financial.aggregate({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      _sum: {
        rentalAmount: true,
        netProfit: true,
      },
    }),
    prisma.financial.aggregate({
      _sum: {
        rentalAmount: true,
        shippingCost: true,
        gstAmount: true,
        doctorCommission: true,
        netProfit: true,
      },
    }),
    prisma.financial.count({
      where: { paymentStatus: PaymentStatus.PENDING },
    }),
    prisma.financial.count({
      where: { paymentStatus: PaymentStatus.PAID },
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

  // Fetch top performing doctors
  const topDoctors = await prisma.doctor.findMany({
    take: 5,
    where: { status: "ACTIVE" },
    include: {
      user: true,
      _count: {
        select: { leads: true },
      },
      leads: {
        include: {
          financial: true,
        },
      },
    },
  });

  // Calculate doctor performance
  const doctorPerformance = topDoctors.map(doctor => {
    const totalCommission = doctor.leads.reduce((sum, lead) => {
      return sum + (lead.financial?.doctorCommission || 0);
    }, 0);
    return {
      name: doctor.user.name,
      city: doctor.city,
      totalLeads: doctor._count.leads,
      totalCommission,
    };
  }).sort((a, b) => b.totalCommission - a.totalCommission);

  // Calculate revenue trend (this month vs last month)
  const thisMonthRevenue = thisMonthFinancials._sum.rentalAmount || 0;
  const lastMonthRevenue = lastMonthFinancials._sum.rentalAmount || 0;
  const revenueGrowth = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  // Calculate total expenses
  const thisMonthExpenses = (thisMonthFinancials._sum.shippingCost || 0) +
    (thisMonthFinancials._sum.gstAmount || 0) +
    (thisMonthFinancials._sum.doctorCommission || 0);

  const allTimeExpenses = (allTimeFinancials._sum.shippingCost || 0) +
    (allTimeFinancials._sum.gstAmount || 0) +
    (allTimeFinancials._sum.doctorCommission || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user.name}
        </h1>
        <p className="text-gray-600 mt-1">
          Here's a comprehensive overview of your phototherapy business
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalLeads}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {newLeads} new, {activeRentals} active, {completedLeads} completed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Active Doctors</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{totalDoctors}</p>
                <p className="text-xs text-gray-500 mt-1">Referring patients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Equipment</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{totalEquipment}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {availableEquipment} available, {inUseEquipment} in use
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingPayments}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {paidPayments} payments received
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview - This Month */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>This Month Financial Summary</span>
            <span className="text-sm font-normal text-gray-500">
              {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">Revenue</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {formatCurrency(thisMonthRevenue)}
              </p>
              {revenueGrowth !== 0 && (
                <p className={`text-xs mt-1 ${revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueGrowth > 0 ? '↑' : '↓'} {Math.abs(revenueGrowth).toFixed(1)}% vs last month
                </p>
              )}
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800 font-medium">Expenses</p>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {formatCurrency(thisMonthExpenses)}
              </p>
              <p className="text-xs text-gray-600 mt-1">Shipping + GST + Commission</p>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800 font-medium">Commission Paid</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">
                {formatCurrency(thisMonthFinancials._sum.doctorCommission || 0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">To doctors</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800 font-medium">Net Profit</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {formatCurrency(thisMonthFinancials._sum.netProfit || 0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">After all expenses</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-800 font-medium">Profit Margin</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {thisMonthRevenue > 0
                  ? ((thisMonthFinancials._sum.netProfit || 0) / thisMonthRevenue * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Efficiency ratio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All-Time Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>All-Time Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border-l-4 border-blue-500 bg-gray-50">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(allTimeFinancials._sum.rentalAmount || 0)}
              </p>
            </div>

            <div className="p-4 border-l-4 border-red-500 bg-gray-50">
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(allTimeExpenses)}
              </p>
            </div>

            <div className="p-4 border-l-4 border-orange-500 bg-gray-50">
              <p className="text-sm text-gray-600">Total Commission</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(allTimeFinancials._sum.doctorCommission || 0)}
              </p>
            </div>

            <div className="p-4 border-l-4 border-green-500 bg-gray-50">
              <p className="text-sm text-gray-600">Total Net Profit</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(allTimeFinancials._sum.netProfit || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">Pending Payouts</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">
                {formatCurrency(pendingPayouts._sum.amount || 0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">{pendingPayouts._count} payouts</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800 font-medium">Paid Payouts</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {formatCurrency(paidPayouts._sum.amount || 0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">{paidPayouts._count} payouts</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">Total Payouts</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {formatCurrency((pendingPayouts._sum.amount || 0) + (paidPayouts._sum.amount || 0))}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {pendingPayouts._count + paidPayouts._count} payouts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Doctors & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Doctors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            {doctorPerformance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No doctor performance data yet
              </div>
            ) : (
              <div className="space-y-3">
                {doctorPerformance.map((doctor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{doctor.name}</p>
                        <p className="text-xs text-gray-500">
                          {doctor.city || 'No city'} • {doctor.totalLeads} leads
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(doctor.totalCommission)}
                      </p>
                      <p className="text-xs text-gray-500">earned</p>
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
            <CardTitle>Recent Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No leads yet. Waiting for doctors to submit patient referrals.
              </div>
            ) : (
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{lead.patientName}</p>
                        <p className="text-sm text-gray-600">
                          Dr. {lead.doctor.user.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(lead.submissionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lead.status === LeadStatus.NEW_LEAD ? 'bg-blue-100 text-blue-800' :
                        lead.status === LeadStatus.ACTIVE_RENTAL ? 'bg-green-100 text-green-800' :
                        lead.status === LeadStatus.COMPLETED ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lead.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
