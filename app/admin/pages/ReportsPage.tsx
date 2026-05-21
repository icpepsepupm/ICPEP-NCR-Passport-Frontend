"use client";

import React from "react";
import { Users, Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

export default function ReportsPage() {
  const { reports, loading, error, refetch } = useAnalytics();

  return (
    <div className="relative min-h-dvh isolate overflow-hidden transition-colors duration-300" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.25), transparent 70%)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.18), transparent 70%)" }} />

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm mb-6" style={{ background: "var(--card-bg)" }}>
          <h2 className="orbitron text-2xl text-cyan-400 font-bold">Analytics Dashboard</h2>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>Overview of users, events, and activity statistics</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-950/20 p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
            <button onClick={() => void refetch()} className="flex items-center gap-1 text-xs text-red-200"><RefreshCw className="w-3.5 h-3.5" /> Retry</button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-cyan-400/25 p-4 animate-pulse" style={{ background: "var(--card-bg)" }}>
                <div className="h-3 w-20 bg-cyan-400/20 rounded mb-3" />
                <div className="h-8 w-12 bg-cyan-400/20 rounded" />
              </div>
            ))}
          </div>
        ) : !reports ? (
          <div className="rounded-xl border border-cyan-400/15 p-12 text-center" style={{ background: "var(--card-bg)" }}>
            <Calendar className="w-12 h-12 mx-auto mb-3 text-cyan-400/30" />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No analytics data available</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel" style={{ background: "var(--card-bg)" }}>
                <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Total Users</div>
                <div className="mt-2 text-2xl text-cyan-300 font-bold">{reports.totalUsers}</div>
              </div>
              <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel" style={{ background: "var(--card-bg)" }}>
                <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Pending Members</div>
                <div className="mt-2 text-2xl text-emerald-400 font-bold">{reports.pendingMembers}</div>
              </div>
              <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel" style={{ background: "var(--card-bg)" }}>
                <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Total Stamps</div>
                <div className="mt-2 text-2xl text-purple-400 font-bold">{reports.totalStamps}</div>
              </div>
              <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel" style={{ background: "var(--card-bg)" }}>
                <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Avg Stamps per Event</div>
                <div className="mt-2 text-2xl text-amber-400 font-bold">{reports.avgStampsPerEvent.toFixed(1)}</div>
              </div>
            </div>

            <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm mb-6 neon-panel" style={{ background: "var(--card-bg)" }}>
              <h3 className="text-xl font-semibold mb-3 text-cyan-400 orbitron">Users per Role</h3>
              {Object.keys(reports.usersPerRole).length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No user role data yet.</p>
              ) : (
                <ul className="divide-y divide-cyan-400/10">
                  {Object.entries(reports.usersPerRole).map(([role, count]) => (
                    <li key={role} className="flex justify-between py-2 px-3 hover:bg-cyan-400/5 rounded">
                      <div className="flex items-center gap-2"><Users className="w-4 h-4 text-cyan-400/60" /><span className="text-sm font-medium">{role}</span></div>
                      <span className="text-sm font-semibold text-cyan-300">{count} ({reports.rolePercentages[role]?.toFixed(1) ?? 0}%)</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm neon-panel" style={{ background: "var(--card-bg)" }}>
              <h3 className="text-xl font-semibold mb-3 text-cyan-400 orbitron">Event Analytics</h3>
              {Object.keys(reports.stampsPerEvent).length === 0 ? (
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No event attendance data yet.</p>
              ) : (
                <ul className="divide-y divide-cyan-400/10">
                  {Object.entries(reports.stampsPerEvent).map(([event, count]) => (
                    <li key={event} className="flex justify-between py-2 px-3 hover:bg-cyan-400/5 rounded">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-cyan-400/60" /><span className="text-sm">{event}</span></div>
                      <span className="text-sm font-semibold text-cyan-300">{count} stamps</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                {reports.mostPopularEvent && <p>Most Popular: {Object.keys(reports.mostPopularEvent)[0]} ({Object.values(reports.mostPopularEvent)[0]} stamps)</p>}
                {reports.leastPopularEvent && <p>Least Popular: {Object.keys(reports.leastPopularEvent)[0]} ({Object.values(reports.leastPopularEvent)[0]} stamps)</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
