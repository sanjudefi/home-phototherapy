import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { EquipmentForm } from "@/components/forms/EquipmentForm";

export default async function NewEquipment() {
  const session = await auth();

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
    redirect("/admin/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Equipment</h1>
        <p className="text-gray-500 mt-1">Register a new phototherapy device</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <EquipmentForm />
        </CardContent>
      </Card>
    </div>
  );
}
