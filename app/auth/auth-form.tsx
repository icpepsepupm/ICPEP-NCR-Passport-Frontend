"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import { setCurrentUser } from "@/app/lib/client-auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getErrorMessage(response: Response, defaultMessage: string): Promise<string> {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      const errorData = await response.json();
      return errorData.message || defaultMessage;
    } catch {
      return "Failed to parse error message from server.";
    }
  }
  return defaultMessage;
}

export default function AuthForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("icpep-user");
    if (stored) {
      const user = JSON.parse(stored);
      const role = user?.role?.toUpperCase();
      const userId = user?.id || user?.memberId; // use id or memberId
      if (role === "ADMIN") router.replace("/admin");
      else if (role === "SCANNER") router.replace("/scanner");
      else if (role === "MEMBER" && userId) router.replace(`/dashboard/passport/${userId}`);
      // do nothing for unknown/default roles
    }
  }, [router]);


  if (!mounted) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") || "").trim();
    const password = String(fd.get("password") || "");

    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorMsg = await getErrorMessage(response, "Invalid username or password.");
        throw new Error(errorMsg);
      }

      const data = await response.json();

      setCurrentUser({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        school: data.schoolId,
        role: data.role,
        memberId: data.memberId || null,
        token: data.token,
      });

      // Redirect by role
      switch (data.role?.toUpperCase()) {
        case "ADMIN":
          router.replace("/admin");
          break;
        case "SCANNER":
          router.replace("/scanner");
          break;
        case "MEMBER":
          // Directly go to passport page with user id
          router.replace(`/dashboard/passport/${data.id || data.memberId}`);
          break;
        default:
          break;
      }

    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input type="text" name="username" label="Username" required />
      <Input type="password" name="password" label="Password" autoComplete="current-password" required />
      {error && <p className="text-sm text-rose-500">{error}</p>}
      <Button type="submit" className="mt-2" disabled={loading} loading={loading}>
        Log In
      </Button>
    </form>
  );
}
