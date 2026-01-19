"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface PayoutEditFormProps {
  payout: {
    id: string;
    status: string;
    paymentDate: Date | null;
    paymentMethod: string | null;
    transactionId: string | null;
    receiptUrl: string | null;
    notes: string | null;
  };
}

const statusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function PayoutEditForm({ payout }: PayoutEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    status: payout.status,
    paymentDate: payout.paymentDate
      ? new Date(payout.paymentDate).toISOString().split("T")[0]
      : "",
    paymentMethod: payout.paymentMethod || "",
    transactionId: payout.transactionId || "",
    receiptUrl: payout.receiptUrl || "",
    notes: payout.notes || "",
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
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/payouts/${payout.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update payout");
      }

      setSuccess("Payout updated successfully!");
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
        <Select
          name="status"
          label="Payment Status"
          options={statusOptions}
          value={formData.status}
          onChange={handleChange}
          disabled={isLoading}
          required
        />

        <Input
          name="paymentDate"
          label="Payment Date"
          type="date"
          value={formData.paymentDate}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Input
          name="paymentMethod"
          label="Payment Method"
          placeholder="e.g., Bank Transfer, UPI"
          value={formData.paymentMethod}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Input
          name="transactionId"
          label="Transaction ID"
          placeholder="e.g., TXN123456789"
          value={formData.transactionId}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Input
          name="receiptUrl"
          label="Receipt URL"
          placeholder="https://example.com/receipt.pdf"
          value={formData.receiptUrl}
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
          type="submit"
          variant="primary"
          className="flex-1"
          isLoading={isLoading}
        >
          Update Payout
        </Button>
      </div>

      <div className="text-xs text-gray-500 pt-2">
        Note: Receipt upload will be implemented with file upload system
      </div>
    </form>
  );
}
