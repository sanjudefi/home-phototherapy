import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { LeadStatus } from "@prisma/client";

export default async function AdminLeads({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
    redirect("/admin/login");
  }

  // Build query filters
  const whereClause: any = {};

  if (params.status && params.status !== "ALL") {
    whereClause.status = params.status as LeadStatus;
  }

  if (params.search) {
    whereClause.OR = [
      { patientName: { contains: params.search, mode: "insensitive" } },
      { patientPhone: { contains: params.search } },
      { patientLocation: { contains: params.search, mode: "insensitive" } },
    ];
  }

  // Fetch leads
  const leads = await prisma.lead.findMany({
    where: whereClause,
    orderBy: { submissionDate: "desc" },
    include: {
      doctor: {
        include: {
          user: true,
        },
      },
      assignedEquipment: true,
      financial: true,
    },
  });

  // Calculate stats
  const stats = {
    total: await prisma.lead.count(),
    newLeads: await prisma.lead.count({ where: { status: "NEW_LEAD" } }),
    active: await prisma.lead.count({ where: { status: "ACTIVE_RENTAL" } }),
    completed: await prisma.lead.count({ where: { status: "COMPLETED" } }),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
        <p className="text-gray-600 mt-1">Manage all patient leads and track progress</p>
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
            <div className="text-2xl font-bold text-blue-600">{stats.newLeads}</div>
            <div className="text-sm text-gray-600 mt-1">New Leads</div>
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
            <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <FilterLink status="ALL" currentStatus={params.status || "ALL"}>
              All Leads ({stats.total})
            </FilterLink>
            <FilterLink status="NEW_LEAD" currentStatus={params.status || "ALL"}>
              New ({stats.newLeads})
            </FilterLink>
            <FilterLink status="CONTACTED" currentStatus={params.status || "ALL"}>
              Contacted
            </FilterLink>
            <FilterLink status="EQUIPMENT_SHIPPED" currentStatus={params.status || "ALL"}>
              Shipped
            </FilterLink>
            <FilterLink status="ACTIVE_RENTAL" currentStatus={params.status || "ALL"}>
              Active ({stats.active})
            </FilterLink>
            <FilterLink status="COMPLETED" currentStatus={params.status || "ALL"}>
              Completed ({stats.completed})
            </FilterLink>
            <FilterLink status="CANCELLED" currentStatus={params.status || "ALL"}>
              Cancelled
            </FilterLink>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {params.status && params.status !== "ALL"
              ? `${params.status.replace(/_/g, " ")} Leads`
              : "All Leads"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">📋</div>
              <p className="text-gray-600">No leads found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/admin/leads/${lead.id}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{lead.patientName}</h3>
                        <StatusBadge status={lead.status} />
                        {lead.assignedEquipment && (
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            {lead.assignedEquipment.name}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Doctor:</span> {lead.doctor.user.name}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {lead.patientPhone}
                        </div>
                        <div>
                          <span className="font-medium">Submitted:</span> {formatDate(lead.submissionDate)}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {lead.patientLocation.substring(0, 30)}...
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 text-blue-600 hover:text-blue-800">
                      →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterLink({
  status,
  currentStatus,
  children
}: {
  status: string;
  currentStatus: string;
  children: React.ReactNode;
}) {
  const isActive = status === currentStatus;

  return (
    <Link
      href={`/admin/leads?status=${status}`}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {children}
    </Link>
  );
}
