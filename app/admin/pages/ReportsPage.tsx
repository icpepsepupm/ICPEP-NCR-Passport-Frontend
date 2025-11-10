"use client";

import React, { useEffect, useState } from "react";
import { Users, FileText, Calendar, AlertCircle } from "lucide-react";

interface ReportsResponse {
  totalUsers: number;
  usersPerRole: Record<string, number>;
  rolePercentages: Record<string, number>;
  pendingMembers: number;
  stampsPerEvent: Record<string, number>;
  totalStamps: number;
  avgStampsPerEvent: number;
  mostPopularEvent?: Record<string, number>;
  leastPopularEvent?: Record<string, number>;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    setMounted(true);

    async function fetchReports() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/reports`);
        if (!res.ok) throw new Error("Failed to fetch reports");

        const data: ReportsResponse = await res.json();
        setReports(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [API_BASE_URL]);

  if (!mounted) return null;

  return (
    <div className="relative min-h-dvh isolate overflow-hidden transition-colors duration-300" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/* Neon Background Glows */}
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

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        {/* Header */}
        <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm animate-fade-in transition-all duration-300 mb-6" style={{ background: "var(--card-bg)" }}>
          <h2 className="orbitron text-2xl text-cyan-400 font-bold">Analytics Dashboard</h2>
          <p className="text-[11px] mt-1 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
            Overview of users, events, and activity statistics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up" style={{ background: "var(--card-bg)" }}>
            <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Total Users</div>
            <div className="mt-2 text-2xl text-cyan-300 font-bold">{reports?.totalUsers ?? 0}</div>
          </div>

          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up" style={{ background: "var(--card-bg)" }}>
            <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Pending Members</div>
            <div className="mt-2 text-2xl text-emerald-400 font-bold">{reports?.pendingMembers ?? 0}</div>
          </div>

          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up" style={{ background: "var(--card-bg)" }}>
            <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Total Stamps</div>
            <div className="mt-2 text-2xl text-purple-400 font-bold">{reports?.totalStamps ?? 0}</div>
          </div>

          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up" style={{ background: "var(--card-bg)" }}>
            <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Avg Stamps per Event</div>
            <div className="mt-2 text-2xl text-amber-400 font-bold">{reports?.avgStampsPerEvent.toFixed(1) ?? 0}</div>
          </div>
        </div>

        {/* Users per Role */}
        <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm mb-6 neon-panel">
          <h3 className="text-xl font-semibold mb-3 text-cyan-400 orbitron">Users per Role</h3>
          {loading && <p className="text-sm text-gray-400">Loading...</p>}
          {error && (
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
          <ul className="divide-y divide-cyan-400/10">
            {reports &&
              Object.entries(reports.usersPerRole).map(([role, count]) => (
                <li key={role} className="flex justify-between py-2 px-3 hover:bg-cyan-400/5 transition-all rounded">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-400/60" />
                    <span className="text-sm font-medium">{role}</span>
                  </div>
                  <span className="text-sm font-semibold text-cyan-300">{count} ({reports.rolePercentages[role].toFixed(1)}%)</span>
                </li>
              ))}
          </ul>
        </div>

        {/* Event Analytics */}
        <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm neon-panel">
          <h3 className="text-xl font-semibold mb-3 text-cyan-400 orbitron">Event Analytics</h3>
          <ul className="divide-y divide-cyan-400/10">
            {reports &&
              Object.entries(reports.stampsPerEvent).map(([event, count]) => (
                <li key={event} className="flex justify-between py-2 px-3 hover:bg-cyan-400/5 transition-all rounded">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400/60" />
                    <span className="text-sm">{event}</span>
                  </div>
                  <span className="text-sm font-semibold text-cyan-300">{count} stamps</span>
                </li>
              ))}
          </ul>

          <div className="mt-3 text-sm text-gray-400">
            {reports?.mostPopularEvent && (
              <p>Most Popular: {Object.keys(reports.mostPopularEvent)[0]} ({Object.values(reports.mostPopularEvent)[0]} stamps)</p>
            )}
            {reports?.leastPopularEvent && (
              <p>Least Popular: {Object.keys(reports.leastPopularEvent)[0]} ({Object.values(reports.leastPopularEvent)[0]} stamps)</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
