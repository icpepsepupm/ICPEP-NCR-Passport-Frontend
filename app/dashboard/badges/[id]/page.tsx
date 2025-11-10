"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Modal from "@/app/components/ui/modal";

type Badge = {
  id: string;
  title: string;
  date?: string;
  eventType: "GENERAL_ASSEMBLY" | "COMPETITION" | "WEBINAR" | "OTHERS";
  icon?: string;
  details?: string;
  venue?: string;
};

type StampDto = {
  id: number;
  stampDate: string;
  eventName: string;
  eventSchedule: string;
  eventVenue: string;
  eventType: "GENERAL_ASSEMBLY" | "COMPETITION" | "WEBINAR" | "OTHERS";
};

type School = {
  id: number;
  name: string;
  code: string;
};

type User = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  schoolId?: number;
  memberId?: string;
};

const EVENT_STYLES = {
  GENERAL_ASSEMBLY: {
    bg: "bg-violet-500/10",
    text: "text-violet-200",
    ring: "ring-violet-400/50",
    chip: "bg-violet-400/20 text-violet-400 font-medium",
  },
  COMPETITION: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-200",
    ring: "ring-cyan-400/50",
    chip: "bg-cyan-400/20 text-cyan-400 font-medium",
  },
  WEBINAR: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-200",
    ring: "ring-emerald-400/50",
    chip: "bg-emerald-400/20 text-emerald-400 font-medium",
  },
  OTHERS: {
    bg: "bg-gray-500/10",
    text: "text-gray-200",
    ring: "ring-gray-400/50",
    chip: "bg-gray-400/20 text-gray-400 font-medium",
  },
} as const;

const eventTypes = ["All", "GENERAL_ASSEMBLY", "COMPETITION", "WEBINAR", "OTHERS"] as const;
type EventTypeFilter = (typeof eventTypes)[number];

export default function BadgesPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(); // ✅ Add router
  const [user, setUser] = React.useState<User | null>(null);
  const [school, setSchool] = React.useState<School | null>(null);
  const [q, setQ] = React.useState("");
  const [eventTypeFilter, setEventTypeFilter] = React.useState<EventTypeFilter>("All");
  const [selected, setSelected] = React.useState<Badge | null>(null);
  const [stamps, setStamps] = React.useState<StampDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

  React.useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const userRes = await fetch(`${API_BASE_URL}/users/${id}`);
        if (!userRes.ok) throw new Error("Failed to fetch user");
        const userData: User = await userRes.json();
        setUser(userData);

        if (userData.schoolId) {
          const schoolRes = await fetch(`${API_BASE_URL}/schools/${userData.schoolId}`);
          if (schoolRes.ok) {
            const schoolData: School = await schoolRes.json();
            setSchool(schoolData);
          }
        }

        const stampsRes = await fetch(`${API_BASE_URL}/stamps/user/${id}`);
        if (!stampsRes.ok) throw new Error("Failed to fetch stamps");
        const stampsData: StampDto[] = await stampsRes.json();
        setStamps(stampsData);
      } catch (error) {
        console.error(error);
        setStamps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, API_BASE_URL]);

  const allBadges = React.useMemo(() => {
    return stamps.map((stamp): Badge => ({
      id: `stamp-${stamp.id}`,
      title: stamp.eventName,
      date: new Date(stamp.eventSchedule).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      eventType: stamp.eventType || "OTHERS",
      icon: "🏅",
      details: `Event held at ${stamp.eventVenue}\nStamped on: ${new Date(stamp.stampDate).toLocaleString()}\nType: ${stamp.eventType || "OTHERS"}`,
      venue: stamp.eventVenue,
    }));
  }, [stamps]);

  const filtered = React.useMemo(() => {
    return allBadges.filter((b) => {
      const matchesType = eventTypeFilter === "All" || b.eventType === eventTypeFilter;
      const matchesQ = q.trim() === "" || b.title.toLowerCase().includes(q.toLowerCase());
      return matchesType && matchesQ;
    });
  }, [allBadges, eventTypeFilter, q]);

  const counts = React.useMemo(() => {
    const result = {
      total: 0,
      general_assembly: 0,
      competition: 0,
      webinar: 0,
      others: 0,
    };

    allBadges.forEach((b) => {
      result.total += 1;
      
      switch (b.eventType) {
        case "GENERAL_ASSEMBLY":
          result.general_assembly += 1;
          break;
        case "COMPETITION":
          result.competition += 1;
          break;
        case "WEBINAR":
          result.webinar += 1;
          break;
        case "OTHERS":
          result.others += 1;
          break;
      }
    });

    return result;
  }, [allBadges]);

  const handleOpen = React.useCallback((badge: Badge) => {
    setSelected(badge);
  }, []);

  // ✅ Navigate to passport page
  const handleBack = React.useCallback(() => {
    router.push(`/dashboard/passport/${id}`);
  }, [router, id]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-cyan-400/20 border-t-cyan-400 animate-spin"></div>
          <p style={{ color: "var(--text-secondary)" }}>Loading badges...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "var(--background)" }}>
        <p style={{ color: "var(--text-secondary)" }}>User not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-4 sm:px-6 py-8 sm:py-10" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header className="mx-auto max-w-7xl animate-fade-in">
        <div className="mb-2 flex items-center justify-between">
          {/* ✅ Updated back button */}
          <button
            onClick={handleBack}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-cyan-400/40 px-3 text-sm hover:border-cyan-300/60 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
          >
            ← Back to Passport
          </button>
        </div>
        <h1 className="orbitron text-2xl sm:text-3xl tracking-wide text-cyan-400">
          {user.firstName} {user.lastName}&apos;s Event Badges
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          {school ? (
            <>
              <span className="font-semibold text-cyan-300">{school.name}</span>
              <span className="mx-2">•</span>
              <span>Achievements earned through participation and engagement</span>
            </>
          ) : (
            "Achievements earned through participation and engagement"
          )}
        </p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
      </header>

      <main className="mx-auto mt-6 max-w-7xl rounded-2xl border border-cyan-400/20 p-4 sm:p-6 neon-panel" style={{ background: "var(--card-bg)" }}>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Total Badges" value={counts.total} />
          <Stat label="General Assembly" value={counts.general_assembly} color="violet" />
          <Stat label="Competition" value={counts.competition} color="cyan" />
          <Stat label="Webinar" value={counts.webinar} color="emerald" />
          <Stat label="Others" value={counts.others} color="gray" />
        </div>

        {/* Filters */}
        <div className="mt-5 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:flex-initial">
            <span className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>🔎</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search badges..."
              className="h-10 w-full sm:w-72 rounded-md border pl-8 pr-3 text-sm outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/40 transition-all"
              style={{
                backgroundColor: "var(--input-bg)",
                borderColor: "var(--input-border)",
                color: "var(--input-text)",
              }}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {eventTypes.map((e) => (
              <button
                key={e}
                onClick={() => setEventTypeFilter(e)}
                className={`h-9 rounded-full px-4 text-sm whitespace-nowrap transition-all duration-300 cursor-pointer ${
                  eventTypeFilter === e ? "bg-cyan-400 text-black orbitron" : "border border-cyan-400/40 hover:border-cyan-300/60"
                }`}
                style={eventTypeFilter === e ? {} : { color: "var(--text-primary)" }}
              >
                {e.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? <NoBadges stamps={stamps} /> : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((b) => <BadgeCard key={b.id} badge={b} onOpen={() => handleOpen(b)} />)}
          </div>
        )}
      </main>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title}>
        {selected ? <BadgeDetails badge={selected} onClose={() => setSelected(null)} /> : null}
      </Modal>
    </div>
  );
}

// -----------------------------
// Components
// -----------------------------
const Stat = React.memo(({ label, value, color }: { label: string; value: number; color?: "cyan" | "violet" | "emerald" | "gray" }) => {
  const ring =
    color === "violet"
      ? "ring-violet-400/40"
      : color === "emerald"
        ? "ring-emerald-400/40"
        : color === "gray"
          ? "ring-gray-400/40"
          : "ring-cyan-400/40";
  return (
    <div className={`rounded-lg border border-cyan-400/20 p-4 ring-1 transition-all hover:scale-105 ${ring}`} style={{ background: "var(--input-bg)" }}>
      <div className="text-2xl font-semibold text-cyan-400">{value}</div>
      <div className="text-xs transition-colors" style={{ color: "var(--text-secondary)" }}>{label}</div>
    </div>
  );
});

const BadgeCard = React.memo(({ badge, onOpen }: { badge: Badge; onOpen: () => void }) => {
  const style = EVENT_STYLES[badge.eventType];
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-cyan-400/20 p-5 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-400/20 ${style.bg}`} style={{ background: "var(--input-bg)" }}>
      <span className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs transition-transform group-hover:scale-110 ${style.chip}`}>
        {badge.eventType.replace(/_/g, " ")}
      </span>
      <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-3xl ring-1 transition-all group-hover:scale-110 group-hover:rotate-6 ${style.ring}`}>{badge.icon}</div>
      <div className="mt-4 font-medium transition-colors" style={{ color: "var(--text-primary)" }}>{badge.title}</div>
      <div className="text-xs transition-colors" style={{ color: "var(--text-secondary)" }}>{badge.date}</div>
      <button onClick={onOpen} className="mt-4 h-9 w-full rounded-md bg-cyan-400 text-sm font-semibold text-black orbitron hover:bg-cyan-300 transition-all hover:scale-105 active:scale-95 cursor-pointer">
        View Details
      </button>
    </div>
  );
});

const BadgeDetails = ({ badge, onClose }: { badge: Badge; onClose: () => void }) => {
  const style = EVENT_STYLES[badge.eventType];
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr]">
      <div className={`mx-auto sm:mx-0 flex h-28 w-28 items-center justify-center rounded-2xl text-5xl ring-1 ${style.ring}`}>
        {badge.icon}
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs ${style.chip}`}>{badge.eventType.replace(/_/g, " ")}</span>
          <span className="text-xs transition-colors" style={{ color: "var(--text-secondary)" }}>{badge.date}</span>
        </div>
        {badge.venue && <p className="mt-2 text-sm transition-colors" style={{ color: "var(--text-secondary)" }}>📍 {badge.venue}</p>}
        {badge.details && (
          <p className="mt-3 whitespace-pre-wrap text-sm transition-colors" style={{ color: "var(--text-secondary)" }}>{badge.details}</p>
        )}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button onClick={onClose} className="h-9 rounded-md border border-cyan-400/40 px-3 text-sm transition-all hover:border-cyan-300/60 cursor-pointer" style={{ color: "var(--text-secondary)" }}>
            Close
          </button>
          <button className="h-9 rounded-md bg-cyan-400 px-3 text-sm font-semibold text-black orbitron hover:bg-cyan-300 transition-all cursor-pointer">
            Share Badge
          </button>
        </div>
      </div>
    </div>
  );
};

const NoBadges = ({ stamps }: { stamps: StampDto[] }) => (
  <div className="mt-10 rounded-lg border border-cyan-400/20 p-10 text-center transition-all" style={{ background: "var(--input-bg)" }}>
    <p style={{ color: "var(--text-secondary)" }}>
      {stamps.length === 0
        ? "No badges earned yet. Attend events to collect badges!"
        : "No badges match your search."}
    </p>
  </div>
);

Stat.displayName = "Stat";
BadgeCard.displayName = "BadgeCard";