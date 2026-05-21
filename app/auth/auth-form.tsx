"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import { setCurrentUser } from "@/app/lib/client-auth";
import { apiClient } from "@/lib/api/client";

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
      const result = await apiClient.post("/auth/signin", { username, password });

      setCurrentUser({
        firstName: result.user?.first_name || "",
        lastName: result.user?.last_name || "",
        username: result.user?.username,
        school: result.user?.school_id || null,
        role: result.user?.role,
        memberId: result.user?.member_id || null,
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
