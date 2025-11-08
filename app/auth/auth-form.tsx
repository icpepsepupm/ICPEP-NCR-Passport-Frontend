"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getErrorMessage(response: Response, defaultMessage: string): Promise<string> {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      const errorData = await response.json();
      return errorData.message || defaultMessage;
    } catch (e) {
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

  /** ----------------------------
   *  Prevent back/forward navigation
   *  ----------------------------
   */
  React.useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      // Push the same state again to block back/forward
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Role-based guard: redirect if user is already logged in
  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("icpep-user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user?.role) {
          switch (user.role.toUpperCase()) {
            case "ADMIN":
              router.replace("/admin");
              break;
            case "SCANNER":
              router.replace("/scanner");
              break;
            case "MEMBER":
              router.replace("/dashboard");
              break;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to parse user from localStorage", e);
    }
  }, [router]);

  if (!mounted) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!API_BASE_URL) {
      setError("API configuration error. Please contact support.");
      setLoading(false);
      return;
    }

    const fd = new FormData(e.currentTarget);

    if (isLogin) {
      const username = String(fd.get("username") || "").trim();
      const password = String(fd.get("password") || "");

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          const errorMsg = await getErrorMessage(response, "Invalid username or password.");
          throw new Error(errorMsg);
        }

        const user = await response.json();

        localStorage.setItem(
          "icpep-user",
          JSON.stringify({
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            schoolId: user.schoolId,
            role: user.role,
            memberId: user.memberId || null,
          })
        );

        switch (user.role.toUpperCase()) {
          case "ADMIN":
            router.replace("/admin");
            break;
          case "SCANNER":
            router.replace("/scanner");
            break;
          case "MEMBER":
          default:
            router.replace("/dashboard");
            break;
        }
      } catch (err: any) {
        setError(err.message || "An error occurred. Please try again.");
        setLoading(false);
      }
    } else {
      const firstName = String(fd.get("firstName") || "").trim();
      const lastName = String(fd.get("lastName") || "").trim();
      const username = String(fd.get("username") || "").trim();
      const password = String(fd.get("password") || "");
      const age = Number(fd.get("age") || 0);
      const schoolId = Number(fd.get("schoolId") || 0);
      const memberId = String(fd.get("memberId") || "");
      const role = "member";

      const userRequest = { firstName, lastName, username, password, age, schoolId, memberId, role };

      try {
        const response = await fetch(`${API_BASE_URL}/api/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userRequest),
        });

        if (!response.ok) {
          const errorMsg = await getErrorMessage(response, "Registration failed. Please try again.");
          throw new Error(errorMsg);
        }

        router.replace("/auth/pending");
      } catch (err: any) {
        setError(err.message || "A network error occurred. Please try again.");
        setLoading(false);
      }
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <Input type="text" name="firstName" label="First Name" required />
            <Input type="text" name="lastName" label="Last Name" required />
            <Input type="text" name="username" label="Username" required />
            <Input type="number" name="age" label="Age" min={0} max={120} />
            <Input type="number" name="schoolId" label="School ID" required />
            <Input type="text" name="memberId" label="Member ID (optional)" />
          </>
        )}
        {isLogin && <Input type="text" name="username" label="Username" required />}
        <Input
          type="password"
          name="password"
          label="Password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
        />
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <Button type="submit" className="mt-2" disabled={loading} loading={loading}>
          {isLogin ? "Log In" : "Register"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <Link
          className="text-cyan-500 underline hover:underline"
          href={isLogin ? "/auth/signup" : "/auth/login"}
        >
          {isLogin ? "Sign up" : "Log in"}
        </Link>
      </p>
    </>
  );
}
