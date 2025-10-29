"use client";

import Image from "next/image";
import Link from "next/link";

export default function PendingApprovalPage() {
  return (
    <div className="relative min-h-dvh isolate grid place-items-center overflow-hidden bg-black text-cyan-50">
      {/* soft glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.25), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.18), transparent 70%)" }}
      />

      <div className="neon-panel mx-4 grid max-w-md place-items-center rounded-2xl border border-cyan-400/30 bg-[#0b0f13]/90 p-10 text-center">
        <div className="rounded-full border border-cyan-400/30 bg-black/40 p-4">
          <Image src="/ICpEP.SE Logo.png" alt="ICpEP.SE" width={120} height={120} />
        </div>
        <h1 className="orbitron mt-6 text-2xl">Wait For Approval</h1>
        <p className="mt-2 text-sm text-cyan-100/70">Join ICpEP.SE NCR A.Y. 2025–2026</p>
        <p className="mt-6 text-xs text-cyan-200/70">Your registration was submitted. You’ll receive access once an admin approves your account.</p>
        <div className="mt-8">
          <Link href="/auth/login" className="text-cyan-300 underline-offset-4 hover:underline">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
