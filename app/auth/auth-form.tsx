"use client";

import * as React from "react";
import Link from "next/link";
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

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("icpep-user");
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.role) {
        switch (user.role.toUpperCase()) {
          case "ADMIN": router.replace("/admin"); break;
          case "SCANNER": router.replace("/scanner"); break;
          case "MEMBER": router.replace("/dashboard"); break;
        }
      }
    }
  }, [router]);

  if (!mounted) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    if (isLogin) {
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

        // ✅ Store token
        if (data.token) localStorage.setItem("icpep-auth-token", data.token);

        // ✅ Store user info
        setCurrentUser({
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          school: data.schoolId,
          role: data.role,
          memberId: data.memberId || null,
        });

        // Redirect by role
        switch (data.role.toUpperCase()) {
          case "ADMIN": router.replace("/admin"); break;
          case "SCANNER": router.replace("/scanner"); break;
          case "MEMBER": 
          default: router.replace("/dashboard"); break;
        }
      } catch (err: any) {
        setError(err.message || "An error occurred. Please try again.");
        setLoading(false);
      }
    } else {
      // Signup code remains the same...
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        {isLogin || <>
          <Input type="text" name="firstName" label="First Name" required />
          <Input type="text" name="lastName" label="Last Name" required />
          <Input type="text" name="username" label="Username" required />
          <Input type="number" name="age" label="Age" min={0} max={120} />
          <Input type="number" name="schoolId" label="School ID" required />
          <Input type="text" name="memberId" label="Member ID (optional)" />
        </>}
        <Input type="text" name="username" label="Username" required={isLogin} />
        <Input type="password" name="password" label="Password" autoComplete={isLogin ? "current-password" : "new-password"} required />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button type="submit" className="mt-2" disabled={loading} loading={loading}>
          {isLogin ? "Log In" : "Register"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <Link className="text-cyan-500 underline hover:underline" href={isLogin ? "/auth/signup" : "/auth/login"}>
          {isLogin ? "Sign up" : "Log in"}
        </Link>
      </p>
    </>
  );
}
