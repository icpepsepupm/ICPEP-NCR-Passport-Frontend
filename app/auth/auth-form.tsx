"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import { setCurrentUser, type BasicUser } from "@/app/lib/client-auth";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

export default function AuthForm({ mode = "login" }: { mode?: "login" | "signup" }) {
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

    if (!username || !password) {
      setError("Username and password are required.");
      setLoading(false);
      return;
    }

    try {
      const result = await apiClient.post<{
        user?: {
          id: string;
          username: string;
          role: string;
          first_name: string;
          last_name: string;
          school_id: number | null;
          member_id: string | null;
        };
        session?: { access_token?: string };
      }>("/auth/signin", { username, password });

      setCurrentUser({
        firstName: result.user?.first_name || "",
        lastName: result.user?.last_name || "",
        username: result.user?.username,
        school: result.user?.school_id != null ? String(result.user.school_id) : undefined,
        role: result.user?.role?.toLowerCase() as BasicUser["role"],
        memberId: result.user?.member_id ?? "",
        id: result.user?.id,
        token: result.session?.access_token,
      });

      // Redirect by role
      switch (result.user?.role?.toUpperCase()) {
        case "ADMIN":
          router.replace("/admin");
          break;
        case "SCANNER":
          router.replace("/scanner");
          break;
        case "MEMBER":
          // Directly go to passport page with user id
          router.replace(`/dashboard/passport/${result.user.id || result.user.member_id}`);
          break;
        default:
          break;
      }

    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) setError("Invalid username or password.");
        else if (err.status === 400) setError(err.message);
        else if (err.status >= 500) setError("Server error. Please try again later.");
        else setError(err.message);
      } else {
        setError("Unable to sign in. Check your connection and try again.");
      }
      setLoading(false);
    }
  }

  if (mode === "signup") {
    return (
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Account registration is managed by administrators. Please contact your chapter officer.
      </p>
    );
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
