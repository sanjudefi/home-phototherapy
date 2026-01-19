import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DoctorEditForm } from "@/components/forms/DoctorEditForm";

export default async function DoctorEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin/login");
  }

  const { id } = await params;

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("authjs.session-token")?.value;

  const response = await fetch(
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/doctors/${id}`,
    {
      headers: {
        Cookie: `authjs.session-token=${sessionToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    redirect("/admin/doctors");
  }

  const data = await response.json();
  const doctor = data.doctor;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Doctor</h1>
      </div>

      <DoctorEditForm doctor={doctor} />
    </div>
  );
}
