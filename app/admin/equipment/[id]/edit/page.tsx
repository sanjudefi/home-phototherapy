import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { EquipmentForm } from "@/components/forms/EquipmentForm";

export default async function EditEquipment({
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Equipment</h1>
        <p className="text-gray-500 mt-1">{equipment.name} - {equipment.serialNumber}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <EquipmentForm equipment={equipment} isEdit={true} />
        </CardContent>
      </Card>
    </div>
  );
}
