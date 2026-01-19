"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface City {
  id: string;
  name: string;
  state: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CityListProps {
  cities: City[];
}

export function CityList({ cities }: CityListProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ name: "", state: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleStatus = async (cityId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/cities/${cityId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update city status");
      }

      toast.success(`City ${!currentStatus ? "activated" : "deactivated"} successfully`);
      router.refresh();
    } catch (error) {
      console.error("Error updating city:", error);
      toast.error("Failed to update city status");
    }
  };

  const handleEdit = (city: City) => {
    setEditingId(city.id);
    setEditFormData({
      name: city.name,
      state: city.state || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({ name: "", state: "" });
  };

  const handleSaveEdit = async (cityId: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/cities/${cityId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update city");
      }

      toast.success("City updated successfully");
      setEditingId(null);
      router.refresh();
    } catch (error: any) {
      console.error("Error updating city:", error);
      toast.error(error.message || "Failed to update city");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (cityId: string, cityName: string) => {
    if (!confirm(`Are you sure you want to delete ${cityName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/cities/${cityId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete city");
      }

      toast.success("City deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Error deleting city:", error);
      toast.error("Failed to delete city");
    }
  };

  if (cities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No cities added yet. Add your first city using the form.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {cities.map((city) => (
        <div key={city.id} className="border border-gray-200 rounded-lg p-4">
          {editingId === city.id ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City Name
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSaveEdit(city.id)}
                  isLoading={isUpdating}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{city.name}</h3>
                  <StatusBadge status={city.isActive ? "ACTIVE" : "INACTIVE"} />
                </div>
                {city.state && (
                  <p className="text-sm text-gray-500 mt-1">{city.state}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(city)}>
                  Edit
                </Button>
                <Button
                  variant={city.isActive ? "danger" : "primary"}
                  size="sm"
                  onClick={() => handleToggleStatus(city.id, city.isActive)}
                >
                  {city.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(city.id, city.name)}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
