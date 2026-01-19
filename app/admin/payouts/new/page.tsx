import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { PayoutCreateForm } from "@/components/forms/PayoutCreateForm";
import { prisma } from "@/lib/prisma";

export default async function NewPayout() {
  const session = await auth();

  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "SUB_ADMIN")) {
    redirect("/admin/login");
  }

  // Fetch all doctors for the dropdown
  const doctors = await prisma.doctor.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      user: {
        name: "asc",
      },
    },
  });

  const doctorOptions = doctors.map((doctor) => ({
    id: doctor.id,
    name: doctor.user.name,
    email: doctor.user.email,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Payout</h1>
        <p className="text-gray-500 mt-1">Process payment to doctor</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout Information</CardTitle>
        </CardHeader>
        <CardContent>
          <PayoutCreateForm doctors={doctorOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
