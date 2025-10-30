"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import usersData from "@/app/data/dummy.json";
import registrationsSeed from "@/app/data/registrations.json";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const isLogin = mode === "login";
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (isLogin) {
      const fd = new FormData(e.currentTarget);
      const email = String(fd.get("email") || "").trim().toLowerCase();
      const password = String(fd.get("password") || "");
      const match = usersData.users.find(
        (u) => u.email.toLowerCase() === email && u.password === password
      );
      if (!match) {
        setError("Invalid email or password.");
        return;
      }
      setLoading(true);
      // store session in localStorage for demo purposes
      localStorage.setItem(
        "icpep-user",
        JSON.stringify({
          name: match.name,
          email: match.email,
          memberId: match.memberId,
            school: match.school,
            role: (match as { role?: "member" | "scanner" | "admin" }).role ?? "member",
        })
      );
        const role = (match as { role?: "member" | "scanner" | "admin" }).role ?? "member";
        const target = role === "admin" ? "/admin" : role === "scanner" ? "/scanner" : "/dashboard";
        setTimeout(() => router.push(target), 300);
    } else {
      // Signup: create a pending registration and redirect to waiting page
      setLoading(true);
      const fd = new FormData(e.currentTarget);
      const name = String(fd.get("name") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const school = String(fd.get("school") || "").trim();

      try {
        const key = "icpep-registrations";
        const raw = localStorage.getItem(key);
        type Registration = { id: number; name: string; email: string; chapter?: string; status: "pending" | "approved" };
        const current: Registration[] = raw ? (JSON.parse(raw) as Registration[]) : (registrationsSeed as Registration[]);
        const nextId = Math.max(0, ...current.map((r) => r.id)) + 1;
        const next = [
          { id: nextId, name, email, chapter: school || undefined, status: "pending" as const },
          ...current,
        ];
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore storage errors in demo
      }

      // Do not log the user in; show pending approval screen
      setTimeout(() => router.push("/auth/pending"), 400);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        {isLogin ? null : (
          <Input
            type="text"
            name="name"
            label="Name"
            autoComplete="name"
            required
          />
        )}

        <Input type="email" name="email" label="Email" autoComplete="email" required />

        {isLogin ? null : (
          <Input type="number" name="age" label="Age" min={0} max={120} />
        )}

        {isLogin ? null : (
          <Input type="text" name="school" label="School" autoComplete="organization" />
        )}

        {isLogin ? null : (
          <Input type="text" name="memberId" label="Member ID" />
        )}

        {isLogin ? (
          <Input
            type="password"
            name="password"
            label="Password"
            autoComplete="current-password"
            required
          />
        ) : (
          <Input
            type="password"
            name="password"
            label="Password"
            autoComplete="new-password"
            required
          />
        )}

        {error ? (
          <p className="text-sm text-rose-500 dark:text-rose-300">{error}</p>
        ) : null}

        <Button type="submit" className="mt-2" disabled={loading} loading={loading}>
          {isLogin ? "Log In" : "Register"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm transition-colors duration-300" style={{ color: "var(--text-muted)" }}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <Link
          className="text-cyan-500 dark:text-cyan-300 underline-offset-4 hover:underline transition-colors duration-300"
          href={isLogin ? "/auth/signup" : "/auth/login"}
        >
          {isLogin ? "Sign up" : "Log in"}
        </Link>
      </p>
    </>
  );
}
