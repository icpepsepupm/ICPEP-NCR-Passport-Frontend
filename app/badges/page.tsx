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
    chip: "bg-cyan-400/20 text-cyan-100",
  },
  Leadership: {
    bg: "bg-violet-500/10",
    text: "text-violet-200",
    ring: "ring-violet-400/50",
    chip: "bg-violet-400/20 text-violet-100",
  },
  Community: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-200",
    ring: "ring-emerald-400/50",
    chip: "bg-emerald-400/20 text-emerald-100",
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
    <div className="min-h-dvh bg-[#06090c] px-6 py-10 text-cyan-50">
      <header className="mx-auto max-w-7xl">
        <div className="mb-2 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-cyan-400/40 px-3 text-sm text-cyan-100/90 transition hover:border-cyan-300/60"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="orbitron text-3xl tracking-wide">My Event Badges</h1>
        <p className="mt-1 text-sm text-cyan-100/70">
          Achievements earned through participation and engagement
        </p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      </header>

      <main className="mx-auto mt-6 max-w-7xl rounded-2xl border border-cyan-400/20 bg-[#0b0f13]/70 p-6 neon-panel">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total Badges" value={counts.total} />
          <Stat label="Technical" value={counts.technical} color="cyan" />
          <Stat label="Leadership" value={counts.leadership} color="violet" />
          <Stat label="Community" value={counts.community} color="emerald" />
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-cyan-200/60">🔎</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search badges..."
              className="h-10 w-72 rounded-md border border-cyan-400/40 bg-transparent pl-8 pr-3 text-sm outline-none placeholder:text-cyan-200/50 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/40"
            />
          </div>
          <div className="flex gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`h-9 rounded-full px-4 text-sm transition ${
                  cat === c
                    ? "bg-cyan-400 text-black orbitron"
                    : "border border-cyan-400/40 text-cyan-100/80 hover:border-cyan-300/60"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="mt-10 rounded-lg border border-cyan-400/20 bg-black/30 p-10 text-center text-cyan-100/70">
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
    <div className={`rounded-lg border border-cyan-400/20 bg-black/40 p-4 ring-1 ${ring}`}>
      <div className="text-2xl font-semibold text-cyan-50">{value}</div>
      <div className="text-xs text-cyan-100/70">{label}</div>
    </div>
  );
}

function BadgeCard({ badge, onOpen }: { badge: Badge; onOpen: () => void }) {
  const style = CAT_STYLES[badge.category as keyof typeof CAT_STYLES] ?? CAT_STYLES.Technical;
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-black/40 p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-400/10 ${style.bg}`}
    >
      <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs ${style.chip}`}>{badge.category}</span>
      <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-3xl ring-1 ${style.ring}`}>{badge.icon}</div>
      <div className="mt-4 font-medium leading-tight">{badge.title}</div>
      <div className="text-xs text-cyan-100/70">{badge.date}</div>
      <button onClick={onOpen} className="mt-4 h-9 w-full rounded-md bg-cyan-400 text-sm font-semibold text-black orbitron transition-colors hover:bg-cyan-300">
        View Details
      </button>
    </div>
  );
}

function BadgeDetails({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const style = CAT_STYLES[badge.category as keyof typeof CAT_STYLES] ?? CAT_STYLES.Technical;
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[140px_1fr]">
      <div className={`flex h-28 w-28 items-center justify-center rounded-2xl text-5xl ring-1 ${style.ring}`}>{badge.icon}</div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs ${style.chip}`}>{badge.category}</span>
          <span className="text-xs text-cyan-100/70">{badge.date}</span>
        </div>
        {badge.details ? (
          <p className="mt-3 whitespace-pre-wrap text-sm text-cyan-100/80">{badge.details}</p>
        ) : (
          <p className="mt-3 text-sm text-cyan-100/80">
            You earned this badge by participating in &quot;{badge.title}&quot;.
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="h-9 rounded-md border border-cyan-400/40 px-3 text-sm text-cyan-100/90 hover:border-cyan-300/60">
            Close
          </button>
          <button className="h-9 rounded-md bg-cyan-400 px-3 text-sm font-semibold text-black orbitron hover:bg-cyan-300">
            Share Badge
          </button>
        </div>
      </div>
    </div>
  );
}
