import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DoctorEditForm } from "@/components/forms/DoctorEditForm";

export default async function EditDoctor({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin/login");
  }

  const { id } = await params;

  // Fetch doctor directly from database
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      },
    },
  });

  if (!doctor) {
    redirect("/admin/doctors");
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Edit Doctor</h1>
        <Link href={`/admin/doctors/${id}`}>
          <Button variant="outline">Back to Details</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{doctor.user.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <DoctorEditForm doctor={doctor} />
        </CardContent>
      </Card>
    </div>
  );
}
