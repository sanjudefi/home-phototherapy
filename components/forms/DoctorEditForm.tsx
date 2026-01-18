"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface DoctorEditFormProps {
  doctor: {
    id: string;
    commissionRate: number;
    clinicName: string | null;
    phone: string | null;
    city: string | null;
    notes: string | null;
  };
}

export function DoctorEditForm({ doctor }: DoctorEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    commissionRate: doctor.commissionRate.toString(),
    clinicName: doctor.clinicName || "",
    phone: doctor.phone || "",
    city: doctor.city || "",
    notes: doctor.notes || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/doctors/${doctor.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          commissionRate: parseFloat(formData.commissionRate),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update doctor");
      }

      setSuccess("Doctor updated successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          name="commissionRate"
          label="Commission Rate (%)"
          type="number"
          step="0.01"
          min="0"
          max="100"
          placeholder="e.g., 15"
          value={formData.commissionRate}
          onChange={handleChange}
          disabled={isLoading}
          required
        />

        <Input
          name="clinicName"
          label="Clinic Name"
          placeholder="e.g., City Pediatric Clinic"
          value={formData.clinicName}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Input
          name="phone"
          label="Phone Number"
          type="tel"
          placeholder="e.g., +91 9876543210"
          value={formData.phone}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Input
          name="city"
          label="City"
          placeholder="e.g., Mumbai"
          value={formData.city}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          placeholder="Additional notes about this doctor..."
          value={formData.notes}
          onChange={handleChange}
          disabled={isLoading}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          isLoading={isLoading}
        >
          Update Doctor
        </Button>
      </div>
    </form>
  );
}
