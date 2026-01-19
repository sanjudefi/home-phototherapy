import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default async function AdminEquipment({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; city?: string }>;
}) {
  const session = await auth();

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const statusFilter = params.status || "ALL";
  const cityFilter = params.city || "ALL";

  // Fetch equipment directly from database
  const where: any = {};

  if (statusFilter !== "ALL") {
    where.status = statusFilter;
  }

  if (cityFilter !== "ALL") {
    where.currentLocationCity = cityFilter;
  }

  const equipmentData = await prisma.equipment.findMany({
    where,
    include: {
      _count: {
        select: {
          rentals: true,
        },
      },
      assignedLeads: {
        where: {
          status: {
            in: ["EQUIPMENT_SHIPPED", "ACTIVE_RENTAL"],
          },
        },
        include: {
          doctor: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform assignedLeads array to currentLead for easier consumption
  const equipment = equipmentData.map((eq) => ({
    ...eq,
    currentLead: eq.assignedLeads[0] || null,
  }));

  // Calculate stats
  const stats = {
    total: equipment.length,
    available: equipment.filter((e: any) => e.status === "AVAILABLE").length,
    inUse: equipment.filter((e: any) => e.status === "IN_USE").length,
    maintenance: equipment.filter((e: any) => e.status === "MAINTENANCE").length,
  };

  const statusOptions = [
    { value: "ALL", label: "All Status" },
    { value: "AVAILABLE", label: "Available" },
    { value: "IN_USE", label: "In Use" },
    { value: "MAINTENANCE", label: "Maintenance" },
    { value: "RETIRED", label: "Retired" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Equipment Management</h1>
        <Link href="/admin/equipment/new">
          <Button variant="primary">+ Add Equipment</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Equipment</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.available}</div>
            <div className="text-sm text-gray-500">Available</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.inUse}</div>
            <div className="text-sm text-gray-500">In Use</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.maintenance}</div>
            <div className="text-sm text-gray-500">Maintenance</div>
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
                href={`/admin/equipment?status=${option.value}${cityFilter !== "ALL" ? `&city=${cityFilter}` : ""}`}
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

      {/* Equipment List */}
      {equipment.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No equipment found</p>
              <Link href="/admin/equipment/new">
                <Button variant="primary">Add Your First Equipment</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {equipment.map((item: any) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">S/N: {item.serialNumber}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {item.modelNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Model:</span>
                      <span className="font-medium">{item.modelNumber}</span>
                    </div>
                  )}
                  {item.manufacturer && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Manufacturer:</span>
                      <span className="font-medium">{item.manufacturer}</span>
                    </div>
                  )}
                  {item.currentLocationCity && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium">{item.currentLocationCity}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Rentals:</span>
                    <span className="font-medium">{item._count?.rentals || 0}</span>
                  </div>
                  {item.currentLead && (
                    <div className="mt-3 p-2 bg-blue-50 rounded">
                      <p className="text-xs text-blue-800">
                        Currently with: {item.currentLead.patientName}
                      </p>
                      <p className="text-xs text-blue-600">
                        Doctor: {item.currentLead.doctor?.user?.name}
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/admin/equipment/${item.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/admin/equipment/${item.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
