"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface PayoutCreateFormProps {
  doctors: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export function PayoutCreateForm({ doctors }: PayoutCreateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    doctorId: "",
    amount: "",
    periodStart: "",
    periodEnd: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!formData.doctorId) {
        throw new Error("Please select a doctor");
      }

      if (parseFloat(formData.amount) <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      const response = await fetch("/api/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payout");
      }

      // Redirect to payouts list
      router.push("/admin/payouts");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const doctorOptions = doctors.map((doctor) => ({
    value: doctor.id,
    label: `${doctor.name} (${doctor.email})`,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Select
        name="doctorId"
        label="Select Doctor"
        placeholder="-- Select a doctor --"
        options={doctorOptions}
        value={formData.doctorId}
        onChange={handleChange}
        disabled={isLoading}
        required
      />

      <Input
        name="amount"
        label="Payout Amount (₹)"
        type="number"
        step="0.01"
        min="0"
        placeholder="e.g., 15000"
        value={formData.amount}
        onChange={handleChange}
        disabled={isLoading}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          name="periodStart"
          label="Period Start Date"
          type="date"
          value={formData.periodStart}
          onChange={handleChange}
          disabled={isLoading}
          required
        />

        <Input
          name="periodEnd"
          label="Period End Date"
          type="date"
          value={formData.periodEnd}
          onChange={handleChange}
          disabled={isLoading}
          required
        />
      </div>

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          placeholder="Additional notes about this payout..."
          value={formData.notes}
          onChange={handleChange}
          disabled={isLoading}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          isLoading={isLoading}
        >
          Create Payout
        </Button>
      </div>
    </form>
  );
}
