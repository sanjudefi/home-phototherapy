"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";

export default function NewLead() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    patientLocation: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit lead");
      }

      setSuccess(true);

      // Reset form
      setFormData({
        patientName: "",
        patientPhone: "",
        patientLocation: "",
        notes: "",
      });

      // Redirect to leads list after 2 seconds
      setTimeout(() => {
        router.push("/doctor/leads");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/doctor/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit New Patient Lead</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Fill in the patient details below. This should take less than 30 seconds.
          </p>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              ✅ Lead submitted successfully! Redirecting to your leads...
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="text"
              name="patientName"
              label="Patient Name"
              placeholder="e.g., John Doe"
              value={formData.patientName}
              onChange={handleChange}
              required
              disabled={isLoading}
            />

            <Input
              type="tel"
              name="patientPhone"
              label="Phone Number"
              placeholder="10-digit mobile number"
              value={formData.patientPhone}
              onChange={handleChange}
              required
              disabled={isLoading}
              maxLength={10}
              helperText="Enter 10-digit mobile number"
            />

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location/Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="patientLocation"
                placeholder="Full address including city"
                value={formData.patientLocation}
                onChange={handleChange}
                required
                disabled={isLoading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                name="notes"
                placeholder="Any special instructions or notes..."
                value={formData.notes}
                onChange={handleChange}
                disabled={isLoading}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                isLoading={isLoading}
                disabled={success}
              >
                Submit Lead
              </Button>
              <Link href="/doctor/dashboard" className="flex-1">
                <Button type="button" variant="secondary" className="w-full" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong><br />
              1. Admin team will review your lead<br />
              2. Patient will be contacted for eligibility<br />
              3. Equipment will be shipped if qualified<br />
              4. You'll earn commission once the rental is completed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
