import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login • ICpEP.SE NCR",
  description: "Access your ICpEP.SE NCR account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh isolate overflow-hidden transition-colors duration-300" style={{ background: "var(--background)" }}>
      {/* Soft radial glows for the futuristic background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full blur-3xl transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(closest-side, rgba(34,211,238,0.25), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(closest-side, rgba(34,211,238,0.18), transparent 70%)",
        }}
      />

      <div className="relative mx-auto flex min-h-dvh max-w-7xl items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
