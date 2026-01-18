import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function EquipmentDetail({
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
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/equipment/${id}`,
    {
      headers: {
        Cookie: `authjs.session-token=${sessionToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    redirect("/admin/equipment");
  }

  const data = await response.json();
  const equipment = data.equipment;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
          <p className="text-gray-500 mt-1">Serial Number: {equipment.serialNumber}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/equipment/${id}/edit`}>
            <Button variant="outline">Edit Equipment</Button>
          </Link>
          <Link href="/admin/equipment">
            <Button variant="outline">Back to List</Button>
          </Link>
        </div>
      </div>

      {/* Equipment Information */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Status</label>
              <div className="mt-1">
                <StatusBadge status={equipment.status} />
              </div>
            </div>
            {equipment.modelNumber && (
              <div>
                <label className="text-sm text-gray-500">Model</label>
                <p className="font-medium">{equipment.modelNumber}</p>
              </div>
            )}
            {equipment.manufacturer && (
              <div>
                <label className="text-sm text-gray-500">Manufacturer</label>
                <p className="font-medium">{equipment.manufacturer}</p>
              </div>
            )}
            {equipment.currentLocationCity && (
              <div>
                <label className="text-sm text-gray-500">Current Location</label>
                <p className="font-medium">{equipment.currentLocationCity}</p>
              </div>
            )}
            {equipment.purchaseDate && (
              <div>
                <label className="text-sm text-gray-500">Purchase Date</label>
                <p className="font-medium">{formatDate(equipment.purchaseDate)}</p>
              </div>
            )}
            {equipment.purchaseCost && (
              <div>
                <label className="text-sm text-gray-500">Purchase Cost</label>
                <p className="font-medium">{formatCurrency(equipment.purchaseCost)}</p>
              </div>
            )}
          </div>
          {equipment.notes && (
            <div className="mt-4">
              <label className="text-sm text-gray-500">Notes</label>
              <p className="mt-1 text-gray-700">{equipment.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Assignment */}
      {equipment.currentLead && (
        <Card>
          <CardHeader>
            <CardTitle>Current Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-blue-600">Patient</label>
                  <p className="font-medium text-blue-900">{equipment.currentLead.patientName}</p>
                  <p className="text-sm text-blue-700">{equipment.currentLead.patientPhone}</p>
                </div>
                <div>
                  <label className="text-sm text-blue-600">Doctor</label>
                  <p className="font-medium text-blue-900">
                    {equipment.currentLead.doctor?.user?.name}
                  </p>
                  <p className="text-sm text-blue-700">
                    {equipment.currentLead.doctor?.user?.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-blue-600">Lead Status</label>
                  <div className="mt-1">
                    <StatusBadge status={equipment.currentLead.status} />
                  </div>
                </div>
                <div className="flex items-end">
                  <Link href={`/admin/leads/${equipment.currentLead.id}`}>
                    <Button variant="outline" size="sm">
                      View Lead Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rental History */}
      <Card>
        <CardHeader>
          <CardTitle>Rental History</CardTitle>
        </CardHeader>
        <CardContent>
          {equipment.rentalHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No rental history yet</p>
          ) : (
            <div className="space-y-3">
              {equipment.rentalHistory.map((rental: any) => (
                <div
                  key={rental.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Patient</label>
                      <p className="font-medium text-sm">{rental.lead.patientName}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Doctor</label>
                      <p className="font-medium text-sm">
                        {rental.lead.doctor?.user?.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Start Date</label>
                      <p className="font-medium text-sm">{formatDate(rental.startDatetime)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">End Date</label>
                      <p className="font-medium text-sm">
                        {rental.endDatetime ? formatDate(rental.endDatetime) : "Ongoing"}
                      </p>
                    </div>
                  </div>
                  {rental.totalHours && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Total Hours: </span>
                      <span className="font-medium text-sm">{rental.totalHours}h</span>
                      {rental.totalCost && (
                        <>
                          <span className="text-gray-300 mx-2">|</span>
                          <span className="text-xs text-gray-500">Total Cost: </span>
                          <span className="font-medium text-sm text-green-600">
                            {formatCurrency(rental.totalCost)}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
