"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface RentalPrice {
  id: string;
  cityId: string;
  cityName: string;
  pricePerDay: number;
}

interface City {
  id: string;
  name: string;
}

interface EquipmentRentalPricingProps {
  equipmentId: string;
  rentalPrices: RentalPrice[];
}

export function EquipmentRentalPricing({
  equipmentId,
  rentalPrices: initialPrices,
}: EquipmentRentalPricingProps) {
  const router = useRouter();
  const [rentalPrices, setRentalPrices] = useState<RentalPrice[]>(initialPrices);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newPrice, setNewPrice] = useState({
    cityId: "",
    pricePerDay: "",
  });

  const [editPrice, setEditPrice] = useState<{ [key: string]: string }>({});

  // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch("/api/cities");
        const data = await response.json();
        setCities(data.cities || []);
      } catch (error) {
        console.error("Error fetching cities:", error);
        toast.error("Failed to load cities");
      }
    };
    fetchCities();
  }, []);

  // Get available cities (not already priced)
  const availableCities = cities.filter(
    (city) => !rentalPrices.some((price) => price.cityId === city.id)
  );

  const handleAddPrice = async () => {
    if (!newPrice.cityId || !newPrice.pricePerDay) {
      toast.error("Please select a city and enter price");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/equipment/${equipmentId}/rental-prices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cityId: newPrice.cityId,
          pricePerDay: parseFloat(newPrice.pricePerDay),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add rental price");
      }

      const data = await response.json();
      setRentalPrices([...rentalPrices, data.rentalPrice]);
      setNewPrice({ cityId: "", pricePerDay: "" });
      setIsAdding(false);
      toast.success("Rental price added successfully");
      router.refresh();
    } catch (error: any) {
      console.error("Error adding rental price:", error);
      toast.error(error.message || "Failed to add rental price");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePrice = async (priceId: string) => {
    const newPriceValue = editPrice[priceId];
    if (!newPriceValue) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/equipment/${equipmentId}/rental-prices/${priceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pricePerDay: parseFloat(newPriceValue),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update rental price");
      }

      const data = await response.json();
      setRentalPrices(
        rentalPrices.map((price) =>
          price.id === priceId ? data.rentalPrice : price
        )
      );
      setEditingId(null);
      setEditPrice({});
      toast.success("Rental price updated successfully");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating rental price:", error);
      toast.error(error.message || "Failed to update rental price");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePrice = async (priceId: string) => {
    if (!confirm("Are you sure you want to delete this rental price?")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/equipment/${equipmentId}/rental-prices/${priceId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete rental price");
      }

      setRentalPrices(rentalPrices.filter((price) => price.id !== priceId));
      toast.success("Rental price deleted successfully");
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting rental price:", error);
      toast.error(error.message || "Failed to delete rental price");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Rental Prices by City</CardTitle>
          {!isAdding && availableCities.length > 0 && (
            <Button variant="primary" size="sm" onClick={() => setIsAdding(true)}>
              + Add City Price
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Add New Price Form */}
        {isAdding && (
          <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add New City Price</h4>
            <div className="flex gap-3">
              <select
                value={newPrice.cityId}
                onChange={(e) => setNewPrice({ ...newPrice, cityId: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="">Select City</option>
                {availableCities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                step="0.01"
                placeholder="Price per day"
                value={newPrice.pricePerDay}
                onChange={(e) =>
                  setNewPrice({ ...newPrice, pricePerDay: e.target.value })
                }
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddPrice}
                isLoading={isLoading}
              >
                Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewPrice({ cityId: "", pricePerDay: "" });
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Rental Prices List */}
        {rentalPrices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No rental prices configured yet.</p>
            <p className="text-sm mt-1">Add prices for different cities to start.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rentalPrices.map((price) => (
              <div
                key={price.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{price.cityName}</p>
                  {editingId === price.id ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={editPrice[price.id] || price.pricePerDay}
                      onChange={(e) =>
                        setEditPrice({ ...editPrice, [price.id]: e.target.value })
                      }
                      disabled={isLoading}
                      className="mt-1 w-48"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">
                      ₹{price.pricePerDay.toFixed(2)} per day
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {editingId === price.id ? (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdatePrice(price.id)}
                        isLoading={isLoading}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setEditPrice({});
                        }}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(price.id);
                          setEditPrice({ [price.id]: price.pricePerDay.toString() });
                        }}
                        disabled={isLoading}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeletePrice(price.id)}
                        isLoading={isLoading}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
