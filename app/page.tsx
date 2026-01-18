import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Home Phototherapy Management System
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Comprehensive solution for managing phototherapy equipment rentals, doctor referrals, and patient care
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Link
            href="/admin/login"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-blue-200 hover:border-blue-400"
          >
            <div className="text-4xl mb-4">👨‍💼</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Admin Portal</h2>
            <p className="text-gray-600">Manage leads, equipment, and financials</p>
          </Link>

          <Link
            href="/doctor/login"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-green-200 hover:border-green-400"
          >
            <div className="text-4xl mb-4">👨‍⚕️</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Doctor Portal</h2>
            <p className="text-gray-600">Submit leads and track earnings</p>
          </Link>

          <Link
            href="/doctor/register"
            className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow border-2 border-purple-200 hover:border-purple-400"
          >
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Doctor Registration</h2>
            <p className="text-gray-600">Join our network of healthcare providers</p>
          </Link>
        </div>

        <div className="mt-16 text-sm text-gray-500">
          <p>Need help? Contact support at support@homephototherapy.com</p>
        </div>
      </div>
    </div>
  );
}
