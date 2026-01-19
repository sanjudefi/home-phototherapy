"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface City {
  id: string;
  name: string;
}

export function DoctorCreateForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cities, setCities] = useState<City[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    clinicName: "",
    phone: "",
    city: "",
    specialization: "",
    commissionRate: "",
  });

  // Fetch cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch("/api/cities");
        const data = await response.json();
        setCities(data.cities || []);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };
    fetchCities();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Validate password length
      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      const response = await fetch("/api/doctors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          commissionRate: formData.commissionRate ? parseFloat(formData.commissionRate) : 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create doctor");
      }

      // Redirect to doctors list
      router.push("/admin/doctors");
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
          label="Full Name"
          placeholder="e.g., Dr. Rajesh Kumar"
          value={formData.name}
          onChange={handleChange}
          disabled={isLoading}
          required
        />

        <Input
          name="email"
          label="Email Address"
          type="email"
          placeholder="e.g., doctor@example.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          required
        />

        <Input
          name="password"
          label="Password"
          type="password"
          placeholder="Minimum 6 characters"
          value={formData.password}
          onChange={handleChange}
          disabled={isLoading}
          required
        />

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

        <Select
          name="city"
          label="City"
          placeholder="-- Select a city --"
          options={cities.map(city => ({ value: city.name, label: city.name }))}
          value={formData.city}
          onChange={handleChange}
          disabled={isLoading}
          required
        />

        <Input
          name="specialization"
          label="Specialization"
          placeholder="e.g., Pediatrics"
          value={formData.specialization}
          onChange={handleChange}
          disabled={isLoading}
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
          Create Doctor
        </Button>
      </div>
    </form>
  );
}
