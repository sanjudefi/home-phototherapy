"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface FinancialEditFormProps {
  financial: {
    id: string;
    rentalAmount: number;
    shippingCost: number;
    gstAmount: number;
    otherExpenses: any;
    paymentStatus: string;
    paymentReceivedDate: Date | null;
  };
}

const paymentStatusOptions = [
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "PARTIAL", label: "Partial" },
];

export function FinancialEditForm({ financial }: FinancialEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const otherExpensesArray = financial.otherExpenses || [];
  const [otherExpenses, setOtherExpenses] = useState<Array<{ description: string; amount: string }>>(
    Array.isArray(otherExpensesArray)
      ? otherExpensesArray.map((exp: any) => ({
          description: exp.description || "",
          amount: exp.amount?.toString() || "0",
        }))
      : []
  );

  const [formData, setFormData] = useState({
    rentalAmount: financial.rentalAmount.toString(),
    shippingCost: financial.shippingCost.toString(),
    gstAmount: financial.gstAmount.toString(),
    paymentStatus: financial.paymentStatus,
    paymentReceivedDate: financial.paymentReceivedDate
      ? new Date(financial.paymentReceivedDate).toISOString().split("T")[0]
      : "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddExpense = () => {
    setOtherExpenses([...otherExpenses, { description: "", amount: "0" }]);
  };

  const handleRemoveExpense = (index: number) => {
    setOtherExpenses(otherExpenses.filter((_, i) => i !== index));
  };

  const handleExpenseChange = (index: number, field: string, value: string) => {
    const updated = [...otherExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setOtherExpenses(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const otherExpensesData = otherExpenses.map((exp) => ({
        description: exp.description,
        amount: parseFloat(exp.amount) || 0,
      }));

      const response = await fetch(`/api/financials/${financial.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rentalAmount: parseFloat(formData.rentalAmount),
          shippingCost: parseFloat(formData.shippingCost),
          gstAmount: parseFloat(formData.gstAmount),
          otherExpenses: otherExpensesData,
          paymentStatus: formData.paymentStatus,
          paymentReceivedDate: formData.paymentReceivedDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update financial record");
      }

      setSuccess("Financial record updated successfully!");
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
          name="rentalAmount"
          label="Rental Amount (₹)"
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g., 15000"
          value={formData.rentalAmount}
          onChange={handleChange}
          disabled={isLoading}
          required
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

        <Input
          name="gstAmount"
          label="GST Amount (₹)"
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g., 2700"
          value={formData.gstAmount}
          onChange={handleChange}
          disabled={isLoading}
        />

        <Select
          name="paymentStatus"
          label="Payment Status"
          options={paymentStatusOptions}
          value={formData.paymentStatus}
          onChange={handleChange}
          disabled={isLoading}
          required
        />

        <Input
          name="paymentReceivedDate"
          label="Payment Received Date"
          type="date"
          value={formData.paymentReceivedDate}
          onChange={handleChange}
          disabled={isLoading}
        />
      </div>

      {/* Other Expenses */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-gray-700">Other Expenses</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddExpense}
            disabled={isLoading}
          >
            + Add Expense
          </Button>
        </div>

        {otherExpenses.map((expense, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 mb-2">
            <div className="col-span-6">
              <input
                type="text"
                placeholder="Description"
                value={expense.description}
                onChange={(e) => handleExpenseChange(index, "description", e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-4">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount"
                value={expense.amount}
                onChange={(e) => handleExpenseChange(index, "amount", e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => handleRemoveExpense(index)}
                disabled={isLoading}
                className="w-full"
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          isLoading={isLoading}
        >
          Update Financial Record
        </Button>
      </div>
    </form>
  );
}
