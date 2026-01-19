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
  quantity: number;
  quantityInUse: number;
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
    quantity: "1",
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
    if (!newPrice.cityId || !newPrice.pricePerDay || !newPrice.quantity) {
      toast.error("Please select a city and enter price and quantity");
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
          quantity: parseInt(newPrice.quantity),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add rental price");
      }

      const data = await response.json();
      setRentalPrices([...rentalPrices, data.rentalPrice]);
      setNewPrice({ cityId: "", pricePerDay: "", quantity: "1" });
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                <select
                  value={newPrice.cityId}
                  onChange={(e) => setNewPrice({ ...newPrice, cityId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  disabled={isLoading}
                >
                  <option value="">Select City</option>
                  {availableCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Quantity Available *</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g., 5"
                  value={newPrice.quantity}
                  onChange={(e) =>
                    setNewPrice({ ...newPrice, quantity: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Price per Day (₹) *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 1000"
                  value={newPrice.pricePerDay}
                  onChange={(e) =>
                    setNewPrice({ ...newPrice, pricePerDay: e.target.value })
                  }
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewPrice({ cityId: "", pricePerDay: "", quantity: "1" });
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddPrice}
                isLoading={isLoading}
              >
                Add City Price
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
            {rentalPrices.map((price) => {
              const available = price.quantity - price.quantityInUse;
              const availabilityClass = available === 0 ? "text-red-600" : available < price.quantity * 0.3 ? "text-orange-600" : "text-green-600";

              return (
              <div
                key={price.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-medium text-gray-900">{price.cityName}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${availabilityClass} bg-opacity-10`}>
                      {available}/{price.quantity} Available
                    </span>
                  </div>
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
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-gray-900">
                        ₹{price.pricePerDay.toFixed(2)} per day
                      </p>
                      <p className="text-xs text-gray-500">
                        In Use: {price.quantityInUse} | Total Quantity: {price.quantity}
                      </p>
                    </div>
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
            );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
