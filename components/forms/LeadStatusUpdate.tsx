"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

interface LeadStatusUpdateProps {
  leadId: string;
  currentStatus: string;
  currentEquipmentId: string | null;
  availableEquipment: Array<{ id: string; name: string }>;
  leadCity?: string | null;
}

const statusOptions = [
  { value: "NEW_LEAD", label: "New Lead" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "EQUIPMENT_SHIPPED", label: "Equipment Shipped" },
  { value: "ACTIVE_RENTAL", label: "Active Rental" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PAYMENT_RECEIVED", label: "Payment Received" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "FAILED", label: "Failed/Not Qualified" },
];

export function LeadStatusUpdate({
  leadId,
  currentStatus,
  currentEquipmentId,
  availableEquipment,
  leadCity,
}: LeadStatusUpdateProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    status: currentStatus,
    assignedEquipmentId: currentEquipmentId || "",
    notes: "",
    daysUsed: "",
    shippingCost: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Check if status is being changed to COMPLETED or PAYMENT_RECEIVED
  const isClosingLead = formData.status === "COMPLETED" || formData.status === "PAYMENT_RECEIVED";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      // Validate that if status is COMPLETED/PAYMENT_RECEIVED, daysUsed must be provided
      if (isClosingLead && !formData.daysUsed) {
        throw new Error("Please enter the number of days the equipment was used");
      }

      const payload: any = {
        status: formData.status,
        notes: formData.notes || null,
        assignedEquipmentId: formData.assignedEquipmentId || null,
      };

      // Include financial data if closing the lead
      if (isClosingLead) {
        payload.daysUsed = parseInt(formData.daysUsed);
        payload.shippingCost = formData.shippingCost ? parseFloat(formData.shippingCost) : 0;
      }

      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update lead");
      }

      setSuccess(true);
      setFormData({ ...formData, notes: "", daysUsed: "", shippingCost: "" });

      // Refresh the page to show updated data
      router.refresh();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const equipmentOptions = [
    { value: "", label: "No Equipment Assigned" },
    ...availableEquipment.map(eq => ({
      value: eq.id,
      label: eq.name,
    })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm">
          ✅ Lead updated successfully!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Select
        name="status"
        label="Status"
        options={statusOptions}
        value={formData.status}
        onChange={handleChange}
        disabled={isLoading}
        required
      />

      <Select
        name="assignedEquipmentId"
        label="Assign Equipment"
        options={equipmentOptions}
        value={formData.assignedEquipmentId}
        onChange={handleChange}
        disabled={isLoading}
      />

      {/* Show additional fields when closing a lead */}
      {isClosingLead && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-4">
          <p className="text-sm font-medium text-yellow-800">
            📋 Complete Rental Information
          </p>

          <Input
            name="daysUsed"
            label="Days Used"
            type="number"
            min="1"
            placeholder="e.g., 3"
            value={formData.daysUsed}
            onChange={handleChange}
            disabled={isLoading}
            required={isClosingLead}
          />

          <Input
            name="shippingCost"
            label="Shipping Cost (₹)"
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g., 500"
            value={formData.shippingCost}
            onChange={handleChange}
            disabled={isLoading}
          />

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
            <p className="font-medium mb-1">💡 Auto-calculation:</p>
            <p>• Rental amount will be calculated based on days used × city-specific equipment price</p>
            <p>• Doctor commission will be calculated automatically based on their commission rate</p>
            <p>• Financial records will be created with all details</p>
          </div>
        </div>
      )}

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes/Comments
        </label>
        <textarea
          name="notes"
          placeholder="Add notes about this status change..."
          value={formData.notes}
          onChange={handleChange}
          disabled={isLoading}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        <p className="mt-1 text-xs text-gray-500">
          These notes will be saved in the status history
        </p>
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        isLoading={isLoading}
      >
        Update Lead
      </Button>
    </form>
  );
}
