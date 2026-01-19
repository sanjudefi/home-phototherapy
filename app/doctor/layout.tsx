import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/doctor/login");
  }

  if (session.user.role !== "DOCTOR") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={{
        name: session.user.name || 'Doctor',
        email: session.user.email || '',
        role: session.user.role,
      }} />
      {/* Main content with sidebar offset */}
      <div className="lg:pl-64">
        {/* Mobile header spacer */}
        <div className="h-14 lg:hidden"></div>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
