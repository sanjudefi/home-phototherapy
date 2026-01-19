import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DoctorEarnings() {
  const session = await auth();

  if (!session || session.user.role !== "DOCTOR") {
    redirect("/doctor/login");
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("authjs.session-token")?.value;

  const response = await fetch(
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payouts`,
    {
      headers: {
        Cookie: `authjs.session-token=${sessionToken}`,
      },
      cache: "no-store",
    }
  );

  const data = await response.json();
  const payouts = data.payouts || [];
  const totals = data.totals || { totalAmount: 0, pending: 0, paid: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Earnings</h1>
        <p className="text-gray-500 mt-1">View your payout history</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalAmount)}</div>
            <div className="text-sm text-gray-500">Total Earnings</div>
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
            <div className="text-sm text-gray-500">Received</div>
          </CardContent>
        </Card>
      </div>

      {/* Payouts List */}
      {payouts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-gray-500">No payouts yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Complete leads to start earning commissions
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payout History ({payouts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payouts.map((payout: any) => (
                <div
                  key={payout.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(payout.amount)}
                        </p>
                        <StatusBadge status={payout.status} />
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          <span className="text-gray-500">Period:</span> {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                        </p>
                        {payout.paymentDate && (
                          <p className="mt-1">
                            <span className="text-gray-500">Paid on:</span> {formatDate(payout.paymentDate)}
                          </p>
                        )}
                        {payout.paymentMethod && (
                          <p className="mt-1">
                            <span className="text-gray-500">Method:</span> {payout.paymentMethod}
                          </p>
                        )}
                        {payout.transactionId && (
                          <p className="mt-1 font-mono text-xs">
                            <span className="text-gray-500">Transaction ID:</span> {payout.transactionId}
                          </p>
                        )}
                      </div>
                      {payout.notes && (
                        <p className="mt-2 text-sm text-gray-500 italic">{payout.notes}</p>
                      )}
                      {payout.receiptUrl && (
                        <div className="mt-2">
                          <a
                            href={payout.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 underline"
                          >
                            View Receipt
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
