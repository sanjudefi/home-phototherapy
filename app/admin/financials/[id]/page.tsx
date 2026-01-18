import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FinancialEditForm } from "@/components/forms/FinancialEditForm";

export default async function FinancialDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
    redirect("/admin/login");
  }

  const { id } = await params;

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("authjs.session-token")?.value;

  const response = await fetch(
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/financials/${id}`,
    {
      headers: {
        Cookie: `authjs.session-token=${sessionToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    redirect("/admin/financials");
  }

  const data = await response.json();
  const financial = data.financial;

  // Calculate other expenses total
  const otherExpensesArray = financial.otherExpenses || [];
  const otherExpensesTotal = Array.isArray(otherExpensesArray)
    ? otherExpensesArray.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0)
    : 0;

  const totalExpenses = financial.shippingCost + financial.gstAmount + otherExpensesTotal;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Details</h1>
          <p className="text-gray-500 mt-1">Patient: {financial.lead.patientName}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/leads/${financial.lead.id}`}>
            <Button variant="outline">View Lead</Button>
          </Link>
          <Link href="/admin/financials">
            <Button variant="outline">Back to List</Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(financial.rentalAmount)}
            </div>
            <div className="text-sm text-gray-500">Rental Amount</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="text-sm text-gray-500">Total Expenses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(financial.doctorCommission)}
            </div>
            <div className="text-sm text-gray-500">Doctor Commission</div>
            <div className="text-xs text-gray-400 mt-1">
              {financial.commissionRateApplied}% rate
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financial.netProfit)}
            </div>
            <div className="text-sm text-gray-500">Net Profit</div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">Rental Amount (Gross Revenue)</span>
              <span className="font-medium text-blue-600">{formatCurrency(financial.rentalAmount)}</span>
            </div>

            <div className="text-sm text-gray-500 font-medium">Expenses:</div>

            <div className="flex justify-between items-center py-2 pl-4 border-b border-gray-100">
              <span className="text-gray-600">Shipping Cost</span>
              <span className="text-gray-900">{formatCurrency(financial.shippingCost)}</span>
            </div>

            <div className="flex justify-between items-center py-2 pl-4 border-b border-gray-100">
              <span className="text-gray-600">GST</span>
              <span className="text-gray-900">{formatCurrency(financial.gstAmount)}</span>
            </div>

            {otherExpensesArray.length > 0 && (
              <>
                {otherExpensesArray.map((expense: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-center py-2 pl-4 border-b border-gray-100"
                  >
                    <span className="text-gray-600">{expense.description || "Other Expense"}</span>
                    <span className="text-gray-900">{formatCurrency(expense.amount || 0)}</span>
                  </div>
                ))}
              </>
            )}

            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700 font-medium">Total Expenses</span>
              <span className="font-medium text-red-600">{formatCurrency(totalExpenses)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">Base Amount (Revenue - Expenses)</span>
              <span className="font-medium">{formatCurrency(financial.baseAmount)}</span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-700">
                Doctor Commission ({financial.commissionRateApplied}% of Base)
              </span>
              <span className="font-medium text-orange-600">
                {formatCurrency(financial.doctorCommission)}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4 mt-2">
              <span className="text-gray-900 font-semibold">Net Profit (Base - Commission)</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(financial.netProfit)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Information */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Patient Name</label>
              <p className="font-medium text-gray-900">{financial.lead.patientName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Doctor</label>
              <p className="font-medium text-gray-900">{financial.lead.doctor.user.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Lead Status</label>
              <div className="mt-1">
                <StatusBadge status={financial.lead.status} />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Payment Status</label>
              <div className="mt-1">
                <StatusBadge status={financial.paymentStatus} />
              </div>
            </div>
            {financial.paymentReceivedDate && (
              <div>
                <label className="text-sm text-gray-500">Payment Received Date</label>
                <p className="font-medium text-gray-900">
                  {formatDate(financial.paymentReceivedDate)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Financial */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Financial Details</CardTitle>
        </CardHeader>
        <CardContent>
          <FinancialEditForm financial={financial} />
        </CardContent>
      </Card>
    </div>
  );
}
