"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DoctorRowProps {
  doctor: any;
}

export function DoctorRow({ doctor }: DoctorRowProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleStatus = async () => {
    const newStatus = doctor.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    if (!confirm(`Are you sure you want to ${newStatus === "ACTIVE" ? "activate" : "deactivate"} this doctor?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/doctors/${doctor.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update doctor status");
      }

      toast.success(`Doctor ${newStatus === "ACTIVE" ? "activated" : "deactivated"} successfully`);
      router.refresh();
    } catch (error) {
      console.error("Error updating doctor:", error);
      toast.error("Failed to update doctor status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this doctor? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/doctors/${doctor.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete doctor");
      }

      toast.success("Doctor deleted successfully");
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting doctor:", error);
      toast.error(error.message || "Failed to delete doctor");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <tr key={doctor.id} className="hover:bg-gray-50">
      <td className="px-4 py-4 whitespace-nowrap">
        <div>
          <div className="font-medium text-gray-900">{doctor.user.name}</div>
          <div className="text-sm text-gray-500">{doctor.user.email}</div>
        </div>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {doctor.clinicName || "-"}
        </div>
        {doctor.city && (
          <div className="text-xs text-gray-500">{doctor.city}</div>
        )}
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-green-600">
          {doctor.commissionRate}%
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900">
          {doctor._count?.leads || 0}
        </span>
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <StatusBadge status={doctor.status || "ACTIVE"} />
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(doctor.createdAt || doctor.user.createdAt)}
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Link href={`/admin/doctors/${doctor.id}`}>
            <Button variant="outline" size="sm">
              View
            </Button>
          </Link>
          <Link href={`/admin/doctors/${doctor.id}/edit`}>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </Link>
          <Button
            variant={doctor.status === "ACTIVE" ? "danger" : "primary"}
            size="sm"
            onClick={handleToggleStatus}
            isLoading={isUpdating}
          >
            {doctor.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
