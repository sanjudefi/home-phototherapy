import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DoctorRow } from "@/components/DoctorRow";

export default async function AdminDoctors({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await auth();

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const searchQuery = params.search || "";

  // Fetch doctors directly from database
  const where: any = {};

  if (searchQuery) {
    where.OR = [
      {
        user: {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      },
      {
        user: {
          email: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      },
      {
        clinicName: {
          contains: searchQuery,
          mode: "insensitive",
        },
      },
    ];
  }

  const doctors = await prisma.doctor.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          status: true,
        },
      },
      _count: {
        select: {
          leads: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform to include status at doctor level
  const transformedDoctors = doctors.map(doctor => ({
    ...doctor,
    status: doctor.status || doctor.user.status,
  }));

  // Calculate stats
  const stats = {
    total: transformedDoctors.length,
    activeThisMonth: transformedDoctors.filter((d: any) => {
      const createdAt = new Date(d.createdAt);
      const now = new Date();
      return (
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()
      );
    }).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Management</h1>
        <Link href="/admin/doctors/new">
          <Button variant="primary">+ Add Doctor</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Doctors</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.activeThisMonth}</div>
            <div className="text-sm text-gray-500">Joined This Month</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form method="get" className="flex gap-2">
            <input
              type="text"
              name="search"
              placeholder="Search by name, email, or clinic..."
              defaultValue={searchQuery}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Button type="submit" variant="primary">
              Search
            </Button>
            {searchQuery && (
              <Link href="/admin/doctors">
                <Button type="button" variant="outline">
                  Clear
                </Button>
              </Link>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Doctors List */}
      {transformedDoctors.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchQuery ? "No doctors found matching your search" : "No doctors registered yet"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Doctors ({transformedDoctors.length})</CardTitle>
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
                      Clinic
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Leads
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transformedDoctors.map((doctor: any) => (
                    <DoctorRow key={doctor.id} doctor={doctor} />
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
