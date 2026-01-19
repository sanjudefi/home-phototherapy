"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface EquipmentFormProps {
  equipment?: {
    id: string;
    name: string | null;
    serialNumber: string | null;
    modelNumber: string | null;
    manufacturer: string | null;
    purchaseDate: Date | null;
    purchaseCost: number | null;
    currentLocationCity: string | null;
    status: string;
    notes: string | null;
  };
  isEdit?: boolean;
}

const statusOptions = [
  { value: "AVAILABLE", label: "Available" },
  { value: "IN_USE", label: "In Use" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "RETIRED", label: "Retired" },
];

export function EquipmentForm({ equipment, isEdit = false }: EquipmentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: equipment?.name || "",
    serialNumber: equipment?.serialNumber || "",
    modelNumber: equipment?.modelNumber || "",
    manufacturer: equipment?.manufacturer || "",
    purchaseDate: equipment?.purchaseDate
      ? new Date(equipment.purchaseDate).toISOString().split("T")[0]
      : "",
    purchaseCost: equipment?.purchaseCost?.toString() || "",
    currentLocationCity: equipment?.currentLocationCity || "",
    status: equipment?.status || "AVAILABLE",
    notes: equipment?.notes || "",
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
      const url = isEdit ? `/api/equipment/${equipment?.id}` : "/api/equipment";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : null,
          purchaseDate: formData.purchaseDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${isEdit ? "update" : "create"} equipment`);
      }

      // Redirect to equipment list
      router.push("/admin/equipment");
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          name="name"
          label="Equipment Name"
          placeholder="e.g., BiliBlanket Plus"
          value={formData.name}
          onChange={handleChange}
          disabled={isLoading}
          required
        />

        <Input
          name="serialNumber"
          label="Serial Number"
          placeholder="e.g., BB-2024-001"
          value={formData.serialNumber}
          onChange={handleChange}
          disabled={isLoading || isEdit}
          required
        />

        <Input
          name="modelNumber"
          label="Model"
          placeholder="e.g., BP-3000"
          value={formData.modelNumber}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Input
          name="manufacturer"
          label="Manufacturer"
          placeholder="e.g., GE Healthcare"
          value={formData.manufacturer}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Input
          name="purchaseDate"
          label="Purchase Date"
          type="date"
          value={formData.purchaseDate}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Input
          name="purchaseCost"
          label="Purchase Cost (₹)"
          type="number"
          step="0.01"
          placeholder="e.g., 50000"
          value={formData.purchaseCost}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Input
          name="currentLocationCity"
          label="Current City"
          placeholder="e.g., Mumbai"
          value={formData.currentLocationCity}
          onChange={handleChange}
          disabled={isLoading}
        />

        {isEdit && (
          <Select
            name="status"
            label="Status"
            options={statusOptions}
            value={formData.status}
            onChange={handleChange}
            disabled={isLoading}
            required
          />
        )}
      </div>

      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          placeholder="Additional information about this equipment..."
          value={formData.notes}
          onChange={handleChange}
          disabled={isLoading}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
      </div>

      <div className="flex gap-3">
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
          {isEdit ? "Update Equipment" : "Add Equipment"}
        </Button>
      </div>
    </form>
  );
}
