"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/app/components/ui/input";
import Button from "@/app/components/ui/button";
import usersData from "@/app/data/dummy.json";

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
        })
      );
  setTimeout(() => router.push("/dashboard/event/kickoff-2025"), 300);
    } else {
      // For signup we just simulate success for now
      setLoading(true);
      const fd = new FormData(e.currentTarget);
      const user = {
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        memberId: String(fd.get("memberId") || "TEMP-NEW"),
        school: String(fd.get("school") || ""),
      };
  localStorage.setItem("icpep-user", JSON.stringify(user));
  setTimeout(() => router.push("/dashboard/event/kickoff-2025"), 400);
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
          <p className="text-sm text-rose-300">{error}</p>
        ) : null}

        <Button type="submit" className="mt-2" disabled={loading} loading={loading}>
          {isLogin ? "Log In" : "Register"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-cyan-100/70">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <Link
          className="text-cyan-300 underline-offset-4 hover:underline"
          href={isLogin ? "/auth/signup" : "/auth/login"}
        >
          {isLogin ? "Sign up" : "Log in"}
        </Link>
      </p>
    </>
  );
}
