import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminPayouts({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; doctorId?: string }>;
}) {
  const session = await auth();

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const statusFilter = params.status || "ALL";
  const doctorFilter = params.doctorId || "ALL";

  // Build query string
  const queryParams = new URLSearchParams();
  if (statusFilter !== "ALL") queryParams.set("status", statusFilter);
  if (doctorFilter !== "ALL") queryParams.set("doctorId", doctorFilter);

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("authjs.session-token")?.value;

  const response = await fetch(
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payouts?${queryParams.toString()}`,
    {
      headers: {
        Cookie: `authjs.session-token=${sessionToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.error("Failed to fetch payouts:", response.status, response.statusText);
  }

  const data = await response.json();
  const payouts = data.payouts || [];
  const totals = data.totals || { totalAmount: 0, pending: 0, paid: 0 };

  console.log("Fetched payouts count:", payouts.length);

  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "PAID", label: "Paid" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payout Management</h1>
        <Link href="/admin/payouts/new">
          <Button variant="primary">+ Create Payout</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalAmount)}</div>
            <div className="text-sm text-gray-500">Total Payouts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totals.pending)}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.paid)}</div>
            <div className="text-sm text-gray-500">Paid</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <Link
                key={option.value}
                href={`/admin/payouts?status=${option.value}${doctorFilter !== "ALL" ? `&doctorId=${doctorFilter}` : ""}`}
              >
                <Button
                  variant={statusFilter === option.value ? "primary" : "outline"}
                  size="sm"
                >
                  {option.label}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payouts List */}
      {payouts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No payouts found</p>
              <Link href="/admin/payouts/new">
                <Button variant="primary">Create First Payout</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Payouts ({payouts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payouts.map((payout: any) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{payout.doctor.user.name}</div>
                        <div className="text-sm text-gray-500">{payout.doctor.user.email}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(payout.periodStart)}
                        </div>
                        <div className="text-xs text-gray-500">
                          to {formatDate(payout.periodEnd)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(payout.amount)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={payout.status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payout.paymentDate ? formatDate(payout.paymentDate) : "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Link href={`/admin/payouts/${payout.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
