"use client";

import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="min-h-dvh bg-black px-6 py-8 text-cyan-50">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="orbitron text-2xl">Admin Dashboard</h1>
          <Link href="/dashboard" className="text-cyan-300 underline-offset-4 hover:underline">
            ← Back to Dashboard
          </Link>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-cyan-400/25 bg-[#0b0f13]/90 p-5 neon-panel">
            <div className="text-sm text-cyan-200/80">Members</div>
            <div className="mt-2 text-3xl font-semibold">1,248</div>
          </div>
          <div className="rounded-2xl border border-cyan-400/25 bg-[#0b0f13]/90 p-5 neon-panel">
            <div className="text-sm text-cyan-200/80">Events</div>
            <div className="mt-2 text-3xl font-semibold">23</div>
          </div>
          <div className="rounded-2xl border border-cyan-400/25 bg-[#0b0f13]/90 p-5 neon-panel">
            <div className="text-sm text-cyan-200/80">Scans today</div>
            <div className="mt-2 text-3xl font-semibold">342</div>
          </div>
        </div>
        <p className="mt-6 text-sm text-cyan-100/70">This is a placeholder admin page. Hook it up to your backend to show real stats and manage events, members, and scanners.</p>
      </div>
    </div>
  );
}
