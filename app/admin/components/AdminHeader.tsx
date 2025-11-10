"use client";

import { useRouter } from "next/navigation";
import { clearCurrentUser } from "@/app/lib/client-auth";

interface AdminHeaderProps {
  name: string;
  backendAvailable?: boolean;
}

export function AdminHeader({ name, backendAvailable }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    // Clear any stored user info
    clearCurrentUser();
    // Redirect to login page
    router.push("/auth/login");
  };

  return (
    <header className="flex justify-between items-center p-6 mb-6 rounded-xl border border-cyan-400/15 backdrop-blur-sm">
      <div>
        <h1 className="text-3xl font-bold text-cyan-400">Admin Dashboard</h1>
        <p className="text-cyan-200/70 mt-1">Welcome, {name}</p>
        {backendAvailable === false && (
          <p className="text-red-400 text-sm mt-1">Backend not available</p>
        )}
      </div>
      <div>
        <button
          onClick={handleLogout}
          className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-100 font-medium py-2 px-4 rounded-lg transition-all"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
