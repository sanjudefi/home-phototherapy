import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
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

  // Fetch equipment directly from database
  const equipment = await prisma.equipment.findUnique({
    where: { id },
  });

  if (!equipment) {
    redirect("/admin/equipment");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Edit Equipment</h1>
        <Link href={`/admin/equipment/${id}`}>
          <Button variant="outline">Back to Details</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{equipment.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <EquipmentForm equipment={equipment} isEdit={true} />
        </CardContent>
      </Card>
    </div>
  );
}
