"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CityForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    state: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create city");
      }

      toast.success("City added successfully");
      setFormData({ name: "", state: "" });
      router.refresh();
    } catch (error: any) {
      console.error("Error creating city:", error);
      toast.error(error.message || "Failed to create city");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          City Name *
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Mumbai"
        />
      </div>

      <div>
        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
          State (Optional)
        </label>
        <input
          type="text"
          id="state"
          value={formData.state}
          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Maharashtra"
        />
      </div>

      <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
        Add City
      </Button>
    </form>
  );
}
