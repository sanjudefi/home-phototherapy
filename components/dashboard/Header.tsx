"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { usePathname } from "next/navigation";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const pathname = usePathname();
  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "SUB_ADMIN";

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href={isAdmin ? "/admin/dashboard" : "/doctor/dashboard"} className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                {isAdmin ? "Admin Portal" : "Doctor Portal"}
              </h1>
            </Link>

            <nav className="hidden md:flex space-x-4">
              {isAdmin ? (
                <>
                  <NavLink href="/admin/dashboard" active={pathname === "/admin/dashboard"}>
                    Dashboard
                  </NavLink>
                  <NavLink href="/admin/doctors" active={pathname.startsWith("/admin/doctors")}>
                    Doctors
                  </NavLink>
                  <NavLink href="/admin/leads" active={pathname.startsWith("/admin/leads")}>
                    Leads
                  </NavLink>
                  <NavLink href="/admin/equipment" active={pathname.startsWith("/admin/equipment")}>
                    Equipment
                  </NavLink>
                  <NavLink href="/admin/financials" active={pathname.startsWith("/admin/financials")}>
                    Financials
                  </NavLink>
                  <NavLink href="/admin/payouts" active={pathname.startsWith("/admin/payouts")}>
                    Payouts
                  </NavLink>
                </>
              ) : (
                <>
                  <NavLink href="/doctor/dashboard" active={pathname === "/doctor/dashboard"}>
                    Dashboard
                  </NavLink>
                  <NavLink href="/doctor/leads" active={pathname.startsWith("/doctor/leads")}>
                    My Leads
                  </NavLink>
                  <NavLink href="/doctor/earnings" active={pathname.startsWith("/doctor/earnings")}>
                    Earnings
                  </NavLink>
                  <NavLink href="/doctor/profile" active={pathname.startsWith("/doctor/profile")}>
                    Profile
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

interface NavLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ href, active, children }) => {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? "bg-blue-100 text-blue-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {children}
    </Link>
  );
};
