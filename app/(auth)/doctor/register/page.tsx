"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";

export default function DoctorRegister() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    city: "",
    specialization: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch("/api/cities?activeOnly=true");
        const data = await response.json();
        setCities(data.cities || []);
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setCitiesLoading(false);
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/doctor/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Registration successful
      router.push("/doctor/login?registered=true");
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Doctor Registration</h1>
          <p className="text-gray-600">Join our network of healthcare providers</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  name="name"
                  label="Full Name"
                  placeholder="Dr. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />

                <Input
                  type="email"
                  name="email"
                  label="Email Address"
                  placeholder="doctor@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="tel"
                  name="phone"
                  label="Phone Number"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  maxLength={10}
                />

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    disabled={isLoading || citiesLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {citiesLoading ? "Loading cities..." : "Select a city"}
                    </option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                type="text"
                name="specialization"
                label="Specialization"
                placeholder="Pediatrics, Dermatology, etc."
                value={formData.specialization}
                onChange={handleChange}
                disabled={isLoading}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="password"
                  name="password"
                  label="Password"
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  minLength={8}
                />

                <Input
                  type="password"
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  minLength={8}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your commission rate will be set by the admin team.
                  You can add your bank details later from your profile.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Register
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <Link href="/" className="block text-sm text-blue-600 hover:text-blue-800">
                ← Back to Home
              </Link>
              <div className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/doctor/login" className="text-blue-600 hover:text-blue-800 font-medium">
                  Sign in here
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
