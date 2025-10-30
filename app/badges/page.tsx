"use client";

import * as React from "react";
import data from "@/app/data/badges.json";
import eventsSeed from "@/app/data/events.json";
import { getCurrentUser } from "@/app/lib/client-auth";
import Link from "next/link";
import Modal from "@/app/components/ui/modal";

type Badge = { id: string; title: string; date?: string; category: "Technical" | "Leadership" | "Community"; icon?: string; details?: string };

const CAT_STYLES = {
  Technical: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-200",
    ring: "ring-cyan-400/50",
    chip: "bg-cyan-400/20 text-cyan-400 font-medium",
  },
  Leadership: {
    bg: "bg-violet-500/10",
    text: "text-violet-200",
    ring: "ring-violet-400/50",
    chip: "bg-violet-400/20 text-violet-400 font-medium",
  },
  Community: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-200",
    ring: "ring-emerald-400/50",
    chip: "bg-emerald-400/20 text-emerald-400 font-medium",
  },
} as const;

const categories = ["All", "Technical", "Leadership", "Community"] as const;

type Cat = (typeof categories)[number];

export default function BadgesPage() {
  const user = getCurrentUser();
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState<Cat>("All");
  const [selected, setSelected] = React.useState<Badge | null>(null);

  type AdminEvent = { id: number; title: string; date: string; location: string; attendees: number; badgeEmoji?: string; details?: string };
  const [events, setEvents] = React.useState<AdminEvent[]>([]);
  const [attendance, setAttendance] = React.useState<Record<string, string[]>>({});

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem("icpep-events");
      setEvents(raw ? (JSON.parse(raw) as AdminEvent[]) : (eventsSeed as AdminEvent[]));
    } catch {
      setEvents(eventsSeed as AdminEvent[]);
    }
    try {
      const rawA = window.localStorage.getItem("icpep-attendance");
      setAttendance(rawA ? (JSON.parse(rawA) as Record<string, string[]>) : {});
    } catch {
      setAttendance({});
    }
  }, []);

  // Build dynamic badges from attendance for the current user using badge mapping from events
  const dynamicBadges = React.useMemo(() => {
    if (!user) return [] as Badge[]; // empty
    const memId = user.memberId ?? "";
    const earnedEventIds = Object.entries(attendance)
      .filter(([, arr]) => arr.includes(memId))
      .map(([k]) => Number(k));

    const eventById = new Map<number, AdminEvent>();
    for (const e of events) eventById.set(e.id, e);

    const picked: Badge[] = [];
    for (const id of earnedEventIds) {
      const ev = eventById.get(id);
      if (!ev) continue;
      picked.push({
        id: `event-${id}`,
        title: ev.title,
        date: ev.date,
        icon: ev.badgeEmoji || "🏅",
        category: "Technical",
        details: ev.details,
      });
    }
    return picked;
  }, [attendance, events, user]);

  const allBadges = React.useMemo(() => {
    // Merge with dedupe by id; prefer earned (dynamic) over static
    const catalog = (data as { badges: Badge[] }).badges as Badge[];
    const map = new Map<string, Badge>();
    for (const b of dynamicBadges) map.set(b.id, b);
    for (const b of catalog) if (!map.has(b.id)) map.set(b.id, b);
    return Array.from(map.values());
  }, [dynamicBadges]);

  const filtered = allBadges.filter((b) => {
    const matchesCat = cat === "All" || b.category === cat;
    const matchesQ = q.trim() === "" || b.title.toLowerCase().includes(q.toLowerCase());
    return matchesCat && matchesQ;
  });

  const counts = allBadges.reduce(
    (acc, b) => {
      acc.total += 1;
      acc[b.category.toLowerCase() as "technical" | "leadership" | "community"] += 1;
      return acc;
    },
    { total: 0, technical: 0, leadership: 0, community: 0 }
  );

  return (
    <div className="min-h-dvh px-4 sm:px-6 py-8 sm:py-10 transition-colors duration-300" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="mx-auto max-w-7xl animate-fade-in">
        <div className="mb-2 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-cyan-400/40 px-3 text-sm transition-all duration-200 hover:border-cyan-300/60 hover:scale-105 active:scale-95"
            style={{ color: "var(--text-secondary)" }}
          >
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="orbitron text-2xl sm:text-3xl tracking-wide text-cyan-400">My Event Badges</h1>
        <p className="mt-1 text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
          Achievements earned through participation and engagement
        </p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      </header>

      <main className="mx-auto mt-6 max-w-7xl rounded-2xl border border-cyan-400/20 p-4 sm:p-6 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)" }}>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total Badges" value={counts.total} />
          <Stat label="Technical" value={counts.technical} color="cyan" />
          <Stat label="Leadership" value={counts.leadership} color="violet" />
          <Stat label="Community" value={counts.community} color="emerald" />
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 transition-colors duration-300" style={{ color: "var(--text-muted)" }}>🔎</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search badges..."
              className="h-10 w-full sm:w-72 rounded-md border outline-none pl-8 pr-3 text-sm focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/40 transition-all duration-300"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--input-text)",
              }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`h-9 rounded-full px-4 text-sm whitespace-nowrap transition-all duration-300 cursor-pointer ${
                  cat === c
                    ? "bg-cyan-400 text-black orbitron"
                    : "border border-cyan-400/40 hover:border-cyan-300/60"
                }`}
                style={cat === c ? {} : { color: "var(--text-primary)" }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="mt-10 rounded-lg border border-cyan-400/20 p-10 text-center transition-all duration-300" style={{ background: "var(--input-bg)", color: "var(--text-secondary)" }}>
            No badges match your search.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((b) => (
              <BadgeCard key={b.id} badge={b} onOpen={() => setSelected(b)} />
            ))}
          </div>
        )}
      </main>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title}>
        {selected ? (
          <BadgeDetails badge={selected} onClose={() => setSelected(null)} />
        ) : null}
      </Modal>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: "cyan" | "violet" | "emerald" }) {
  const ring =
    color === "violet"
      ? "ring-violet-400/40"
      : color === "emerald"
      ? "ring-emerald-400/40"
      : "ring-cyan-400/40";
  return (
    <div className={`rounded-lg border border-cyan-400/20 p-4 ring-1 transition-all duration-300 hover:scale-105 animate-fade-in ${ring}`} style={{ background: "var(--input-bg)" }}>
      <div className="text-2xl font-semibold text-cyan-400">{value}</div>
      <div className="text-xs transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{label}</div>
    </div>
  );
}

function BadgeCard({ badge, onOpen }: { badge: Badge; onOpen: () => void }) {
  const style = CAT_STYLES[badge.category as keyof typeof CAT_STYLES] ?? CAT_STYLES.Technical;
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-cyan-400/20 p-5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-400/20 animate-fade-in ${style.bg}`}
      style={{ background: "var(--input-bg)" }}
    >
      <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs transition-transform duration-200 group-hover:scale-110 ${style.chip}`}>{badge.category}</span>
      <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-3xl ring-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${style.ring}`}>{badge.icon}</div>
      <div className="mt-4 font-medium leading-tight transition-colors duration-300" style={{ color: "var(--text-primary)" }}>{badge.title}</div>
      <div className="text-xs transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{badge.date}</div>
      <button 
        onClick={onOpen} 
        className="mt-4 h-9 w-full rounded-md bg-cyan-400 text-sm font-semibold text-black orbitron transition-all duration-200 hover:bg-cyan-300 hover:scale-105 active:scale-95 cursor-pointer"
      >
        View Details
      </button>
    </div>
  );
}

function BadgeDetails({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const style = CAT_STYLES[badge.category as keyof typeof CAT_STYLES] ?? CAT_STYLES.Technical;
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr]">
      <div className={`mx-auto sm:mx-0 flex h-28 w-28 items-center justify-center rounded-2xl text-5xl ring-1 ${style.ring}`}>{badge.icon}</div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs ${style.chip}`}>{badge.category}</span>
          <span className="text-xs transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{badge.date}</span>
        </div>
        {badge.details ? (
          <p className="mt-3 whitespace-pre-wrap text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{badge.details}</p>
        ) : (
          <p className="mt-3 text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
            You earned this badge by participating in &quot;{badge.title}&quot;.
          </p>
        )}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button onClick={onClose} className="h-9 rounded-md border border-cyan-400/40 px-3 text-sm transition-all duration-300 hover:border-cyan-300/60 cursor-pointer" style={{ color: "var(--text-secondary)" }}>
            Close
          </button>
          <button className="h-9 rounded-md bg-cyan-400 px-3 text-sm font-semibold text-black orbitron hover:bg-cyan-300 cursor-pointer">
            Share Badge
          </button>
        </div>
      </div>
    </div>
  );
}
