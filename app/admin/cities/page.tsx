import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { CityList } from "@/components/CityList";
import { CityForm } from "@/components/forms/CityForm";

export default async function AdminCities() {
  const session = await auth();

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
    redirect("/admin/login");
  }

  const cities = await prisma.city.findMany({
    orderBy: {
      name: "asc",
    },
  });

  const stats = {
    total: cities.length,
    active: cities.filter((c) => c.isActive).length,
    inactive: cities.filter((c) => !c.isActive).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">City Management</h1>
        <p className="text-gray-600 mt-1">Manage cities where phototherapy equipment rental services are offered</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Cities</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-500">Active Cities</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            <div className="text-sm text-gray-500">Inactive Cities</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add New City Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add New City</CardTitle>
            </CardHeader>
            <CardContent>
              <CityForm />
            </CardContent>
          </Card>
        </div>

        {/* Cities List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Cities ({cities.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <CityList cities={cities} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
