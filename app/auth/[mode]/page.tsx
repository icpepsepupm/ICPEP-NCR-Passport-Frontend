import { notFound } from "next/navigation";
import AuthCard from "@/app/components/sections/auth-card";
import AuthForm from "@/app/auth/auth-form";

export default async function AuthPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  const isLogin = mode === "login";
  const isSignup = mode === "signup";

  if (!isLogin && !isSignup) notFound();

  return (
    <AuthCard
      title={isLogin ? "Login" : "Create account"}
      subtitle={
        isLogin
          ? "Access your ICpEP.SE NCR account"
          : "Join ICpEP.SE NCR A.Y. 2025–2026"
      }
    >
      <AuthForm mode={isLogin ? "login" : "signup"} />
    </AuthCard>
  );
}
