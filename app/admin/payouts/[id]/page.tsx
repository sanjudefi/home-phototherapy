import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PayoutEditForm } from "@/components/forms/PayoutEditForm";

export default async function PayoutDetail({
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
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payouts/${id}`,
    {
      headers: {
        Cookie: `authjs.session-token=${sessionToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    redirect("/admin/payouts");
  }

  const data = await response.json();
  const payout = data.payout;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payout Details</h1>
          <p className="text-gray-500 mt-1">Doctor: {payout.doctor.user.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/doctors/${payout.doctor.id}`}>
            <Button variant="outline">View Doctor</Button>
          </Link>
          <Link href="/admin/payouts">
            <Button variant="outline">Back to List</Button>
          </Link>
        </div>
      </div>

      {/* Payout Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-500">Doctor</label>
              <p className="font-medium text-gray-900">{payout.doctor.user.name}</p>
              <p className="text-sm text-gray-500">{payout.doctor.user.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Amount</label>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(payout.amount)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Period Start</label>
              <p className="font-medium text-gray-900">{formatDate(payout.periodStart)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Period End</label>
              <p className="font-medium text-gray-900">{formatDate(payout.periodEnd)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Status</label>
              <div className="mt-1">
                <StatusBadge status={payout.status} />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Payment Date</label>
              <p className="font-medium text-gray-900">
                {payout.paymentDate ? formatDate(payout.paymentDate) : "-"}
              </p>
            </div>
            {payout.paymentMethod && (
              <div>
                <label className="text-sm text-gray-500">Payment Method</label>
                <p className="font-medium text-gray-900">{payout.paymentMethod}</p>
              </div>
            )}
            {payout.transactionId && (
              <div>
                <label className="text-sm text-gray-500">Transaction ID</label>
                <p className="font-medium text-gray-900 font-mono text-xs">{payout.transactionId}</p>
              </div>
            )}
          </div>

          {payout.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="text-sm text-gray-500">Notes</label>
              <p className="mt-1 text-gray-700">{payout.notes}</p>
            </div>
          )}

          {payout.receiptUrl && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="text-sm text-gray-500">Payment Receipt</label>
              <div className="mt-2">
                <a
                  href={payout.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  View Receipt
                </a>
              </div>
            </div>
          )}

          {payout.processedBy && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="text-sm text-gray-500">Processed By</label>
              <p className="mt-1 font-medium text-gray-900">{payout.processedBy.name}</p>
              <p className="text-sm text-gray-500">{payout.processedBy.email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Payout */}
      <Card>
        <CardHeader>
          <CardTitle>Update Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <PayoutEditForm payout={payout} />
        </CardContent>
      </Card>
    </div>
  );
}
