"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/app/lib/client-auth";
import eventsData from "@/app/data/events.json";
import membersData from "@/app/data/members.json";
import attendanceData from "@/app/data/attendance.json";
import registrationsSeed from "@/app/data/registrations.json";
import Modal from "@/app/components/ui/modal";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import EmojiPicker from "@/app/components/ui/emoji-picker";

type AdminEvent = {
  id: number;
  title: string;
  date: string; // YYYY-MM-DD
  location: string;
  attendees: number;
  badgeEmoji?: string;
  details?: string;
};

export default function AdminPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const isAdmin = user?.role === "admin";

  // Local state for events (CRUD stubs)
  const [events, setEvents] = React.useState<AdminEvent[]>([]);
  const [query, setQuery] = React.useState("");

  // Create/Edit modal state
  type Draft = Omit<AdminEvent, "id" | "attendees"> & { attendees?: number } & { id?: number };
  const [openForm, setOpenForm] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [draft, setDraft] = React.useState<Draft>({ title: "", date: "", location: "", badgeEmoji: "", details: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [emojiOpen, setEmojiOpen] = React.useState(false);
  // No external badge catalog; admin defines an emoji and details per event.
  const [openDeleteId, setOpenDeleteId] = React.useState<number | null>(null);
  const [activeTab, setActiveTab] = React.useState<"events" | "members" | "census" | "reports">("events");
  const [openAttendeesFor, setOpenAttendeesFor] = React.useState<number | null>(null);
  const [openReport, setOpenReport] = React.useState<null | "attendance" | "member">(null);
  const [reportEventId, setReportEventId] = React.useState<number | null>(null);
  const [attendeeQuery, setAttendeeQuery] = React.useState("");
  const [chapterFilter, setChapterFilter] = React.useState("all");

  const storageKey = "icpep-events";
  const regStorageKey = "icpep-registrations";

  // Load from localStorage or fallback to bundled JSON
  React.useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
      if (raw) {
        const parsed = JSON.parse(raw) as AdminEvent[];
        setEvents(parsed);
        return;
      }
    } catch {
      // ignore
    }
    setEvents(eventsData as AdminEvent[]);
  }, []);

  // Registrations state (members approval)
  type Registration = { id: number; name: string; email: string; chapter?: string; status: "pending" | "approved" };
  const [registrations, setRegistrations] = React.useState<Registration[]>([]);
  React.useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(regStorageKey) : null;
      if (raw) {
        setRegistrations(JSON.parse(raw) as Registration[]);
        return;
      }
    } catch {}
    setRegistrations(registrationsSeed as Registration[]);
  }, []);
  React.useEffect(() => {
    try {
      if (registrations.length > 0) {
        window.localStorage.setItem(regStorageKey, JSON.stringify(registrations));
      }
    } catch {}
  }, [registrations]);

  // Persist to localStorage
  React.useEffect(() => {
    try {
      if (events.length > 0) {
        window.localStorage.setItem(storageKey, JSON.stringify(events));
      }
    } catch {
      // ignore
    }
  }, [events]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.date.toLowerCase().includes(q)
    );
  }, [events, query]);

  // Census derived data
  type Member = { id: string; name: string; chapter?: string };
  const membersObj = membersData as { totalMembers?: number; members: Member[] };
  const memberIndex = React.useMemo(() => {
    const idx = new Map<string, Member>();
    for (const m of membersObj.members) idx.set(m.id, m);
    return idx;
  }, [membersObj.members]);
  // Attendance: merge seed JSON with localStorage overrides produced by Scanner
  const attStorageKey = "icpep-attendance";
  const [attendanceOverride, setAttendanceOverride] = React.useState<Record<string, string[]>>({});
  React.useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(attStorageKey) : null;
      if (raw) setAttendanceOverride(JSON.parse(raw) as Record<string, string[]>);
    } catch {}
  }, []);

  const attendanceMap = React.useMemo(() => {
    const base = attendanceData as Record<string, string[]>;
    const merged: Record<string, string[]> = { ...base };
    for (const [k, v] of Object.entries(attendanceOverride)) {
      const set = new Set([...(merged[k] ?? []), ...v]);
      merged[k] = Array.from(set);
    }
    return merged;
  }, [attendanceOverride]);

  const totalMembers = membersObj.totalMembers ?? membersObj.members.length;
  const totalEvents = events.length;
  const totalAttendance = React.useMemo(() => {
    let sum = 0;
    for (const e of events) {
      const arr = attendanceMap[String(e.id)] ?? [];
      sum += arr.length;
    }
    return sum;
  }, [events, attendanceMap]);

  function attendeesFor(eventId: number): Member[] {
    const ids = attendanceMap[String(eventId)] ?? [];
    return ids.map((id) => memberIndex.get(id) ?? { id, name: id, chapter: "Unknown" });
  }

  // helpers
  function downloadCSV(filename: string, rows: Array<Record<string, string | number>>) {
    const headers = Object.keys(rows[0] ?? {});
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => String(r[h] ?? "")).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Derived for member report
  const chapters = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of membersObj.members) if (m.chapter) set.add(m.chapter);
    return ["all", ...Array.from(set)];
  }, [membersObj.members]);

  const engagement = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const ids of Object.values(attendanceMap)) {
      for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const arr = Array.from(counts.entries()).map(([id, count]) => ({
      member: memberIndex.get(id) ?? { id, name: id, chapter: "Unknown" },
      count,
    }));
    return arr.sort((a, b) => b.count - a.count);
  }, [attendanceMap, memberIndex]);

  // When opening attendance report, set default event selection
  React.useEffect(() => {
    if (openReport === "attendance") {
      setReportEventId((events[0]?.id ?? null));
      setAttendeeQuery("");
    }
    if (openReport === "member") {
      setChapterFilter("all");
    }
  }, [openReport, events]);

  function openCreate() {
    setEditingId(null);
    setDraft({ title: "", date: "", location: "", attendees: 0 });
    setErrors({});
    setOpenForm(true);
  }

  function openEdit(id: number) {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setEditingId(id);
    setDraft({ title: ev.title, date: ev.date, location: ev.location, attendees: ev.attendees, badgeEmoji: ev.badgeEmoji ?? "", details: ev.details ?? "" });
    setErrors({});
    setOpenForm(true);
  }

  function validate(d: Draft) {
    const next: Record<string, string> = {};
    if (!d.title?.trim()) next.title = "Required";
    if (!d.date?.trim()) next.date = "Required";
    if (!d.location?.trim()) next.location = "Required";
    if (!d.badgeEmoji?.trim()) next.badgeEmoji = "Provide an emoji (e.g., 🏅)";
    if (!d.details?.trim()) next.details = "Provide event details";
    if (d.attendees != null && (Number.isNaN(d.attendees) || d.attendees < 0)) next.attendees = "Invalid";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function submitDraft() {
    if (!validate(draft)) return;
    const attendees = draft.attendees ?? 0;
    if (editingId == null) {
      // create
      const next: AdminEvent = {
        id: Math.max(0, ...events.map((e) => e.id)) + 1,
        title: draft.title.trim(),
        date: draft.date.trim(),
        location: draft.location.trim(),
        attendees,
        badgeEmoji: draft.badgeEmoji?.trim() || undefined,
        details: draft.details?.trim() || undefined,
      };
      setEvents((prev) => [next, ...prev]);
    } else {
      // update
      setEvents((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? { ...e, title: draft.title.trim(), date: draft.date.trim(), location: draft.location.trim(), attendees, badgeEmoji: draft.badgeEmoji?.trim() || undefined, details: draft.details?.trim() || undefined }
            : e
        )
      );
    }
    setOpenForm(false);
  }

  function confirmDelete(id: number) {
    setOpenDeleteId(id);
  }

  function doDelete() {
    if (openDeleteId == null) return;
    setEvents((prev) => prev.filter((e) => e.id !== openDeleteId));
    setOpenDeleteId(null);
  }

  return (
    <div className="relative min-h-dvh isolate overflow-hidden bg-black text-cyan-50">
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

      <div className="relative mx-auto max-w-7xl px-6 py-6">
        {/* Top bar */}
        <div className="rounded-xl border border-cyan-400/15 bg-[#0b0f13]/70 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/ICpEP.SE Logo.png" alt="logo" width={28} height={28} />
              <div>
                <div className="orbitron text-lg leading-none">Admin Dashboard</div>
                <div className="text-[10px] text-cyan-200/60">ICpEP NCR Management</div>
              </div>
            </div>

            <button
              onClick={() => {
                try {
                  window.localStorage.removeItem("icpep-user");
                } catch {}
                router.push("/auth/login");
              }}
              className="h-8 rounded-md border border-cyan-400/40 px-3 text-[11px] text-cyan-100/90 transition hover:border-cyan-300/60"
            >
              Log out
            </button>
          </div>

          {/* Tabs + Create */}
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("events")}
                className={
                  "h-8 rounded-full px-4 text-[11px] " +
                  (activeTab === "events"
                    ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-100/90 ring-1 ring-cyan-400/40"
                    : "border border-cyan-400/20 text-cyan-100/70 hover:border-cyan-400/40")
                }
              >
                Events
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={
                  "h-8 rounded-full px-4 text-[11px] " +
                  (activeTab === "members"
                    ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-100/90 ring-1 ring-cyan-400/40"
                    : "border border-cyan-400/20 text-cyan-100/70 hover:border-cyan-400/40")
                }
              >
                Members
              </button>
              <button
                onClick={() => setActiveTab("census")}
                className={
                  "h-8 rounded-full px-4 text-[11px] " +
                  (activeTab === "census"
                    ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-100/90 ring-1 ring-cyan-400/40"
                    : "border border-cyan-400/20 text-cyan-100/70 hover:border-cyan-400/40")
                }
              >
                Census
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={
                  "h-8 rounded-full px-4 text-[11px] " +
                  (activeTab === "reports"
                    ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-100/90 ring-1 ring-cyan-400/40"
                    : "border border-cyan-400/20 text-cyan-100/70 hover:border-cyan-400/40")
                }
              >
                Reports
              </button>
            </div>
            {activeTab === "events" ? (
              <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search events…"
                  className="h-8 w-[220px] rounded-md border border-cyan-400/30 bg-transparent px-3 text-[11px] outline-none placeholder:text-cyan-200/50 focus:border-cyan-300"
                />
              </div>
              <button
                onClick={openCreate}
                className="h-8 rounded-md bg-teal-500/90 px-3 text-[11px] font-semibold text-black transition hover:bg-teal-400"
              >
                + Create Event
              </button>
              </div>
            ) : activeTab === "members" ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:block">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search members…"
                    className="h-8 w-[220px] rounded-md border border-cyan-400/30 bg-transparent px-3 text-[11px] outline-none placeholder:text-cyan-200/50 focus:border-cyan-300"
                  />
                </div>
                <button
                  onClick={() => {
                    // Seed a dummy pending registration quickly
                    const nextId = Math.max(0, ...registrations.map((r) => r.id)) + 1;
                    setRegistrations((prev) => [
                      { id: nextId, name: "New Applicant", email: `applicant${nextId}@mail.com`, status: "pending" },
                      ...prev,
                    ]);
                  }}
                  className="h-8 rounded-md border border-cyan-400/40 px-3 text-[11px] text-cyan-100/90 transition hover:border-cyan-300/60"
                >
                  + Add Dummy Applicant
                </button>
              </div>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>
        </div>

        {!isAdmin ? (
          <div className="mt-6 rounded-xl border border-yellow-400/30 bg-yellow-900/20 p-4 text-sm">
            Access restricted. This page is for admin role accounts. Please log in as an admin user.
          </div>
        ) : null}

        {activeTab === "events" ? (
          <>
            <h2 className="mt-6 text-sm text-cyan-100/80">Manage Events</h2>
            <div className="mt-3 space-y-4">
              {filtered.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-cyan-400/25 bg-[#071015]/70 p-4 shadow-[0_0_0_1px_rgba(34,211,238,0.08)_inset] neon-panel"
                >
                  <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="grid w-full grid-cols-2 gap-x-10 gap-y-1 md:grid-cols-4">
                      <div>
                        <div className="text-[11px] text-cyan-200/70">Title</div>
                        <div className="orbitron text-sm">{ev.title}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-cyan-200/70">Date</div>
                        <div className="text-sm">{ev.date}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-cyan-200/70">Location</div>
                        <div className="text-sm">{ev.location}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-cyan-200/70">Attendees</div>
                        <div className="text-sm text-emerald-400">{ev.attendees}</div>
                      </div>
                      <div className="md:col-span-4">
                        <div className="text-[11px] text-cyan-200/70">Badge</div>
                        <div className="text-sm">{ev.badgeEmoji ? `${ev.badgeEmoji} ${ev.title}` : "—"}</div>
                        {ev.details ? (
                          <div className="mt-1 text-[12px] text-cyan-200/80 line-clamp-2">{ev.details}</div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-stretch md:self-auto">
                      <button
                        title="Edit"
                        onClick={() => openEdit(ev.id)}
                        className="grid h-9 w-9 place-content-center rounded-md border border-cyan-400/30 bg-black/30 text-cyan-100/90 transition hover:border-cyan-300/60"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                          <path d="M16.862 3.487a1.5 1.5 0 0 1 2.121 2.121L8.25 16.34 4.5 17.25l.91-3.75L16.862 3.487Z" />
                        </svg>
                      </button>
                      <button
                        title="Delete"
                        onClick={() => confirmDelete(ev.id)}
                        className="grid h-9 w-9 place-content-center rounded-md border border-red-400/40 bg-black/30 text-red-300 transition hover:border-red-300/70"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                          <path d="M6 7h12M9 7v10m6-10v10M4 7h16l-1 13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 7Zm4-3h8l1 3H7l1-3Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : activeTab === "members" ? (
          <>
            <h2 className="mt-6 orbitron text-lg">Approved Members</h2>
            <div className="mt-3 space-y-4">
              {registrations
                .filter((r) =>
                  query ? r.name.toLowerCase().includes(query.toLowerCase()) || r.email.toLowerCase().includes(query.toLowerCase()) : true
                )
                .map((r) => (
                  <div key={r.id} className="rounded-xl border border-cyan-400/25 bg-[#071015]/70 p-4 neon-panel">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="orbitron text-[15px] text-cyan-100">{r.name}</div>
                        <div className="text-[11px] text-cyan-200/70">{r.email}</div>
                        <div className="mt-1 inline-flex items-center rounded-full px-2 py-[2px] text-[10px]"
                          style={{
                            backgroundColor: r.status === "approved" ? "rgb(5 150 105 / 0.2)" : "rgb(234 179 8 / 0.15)",
                            border: r.status === "approved" ? "1px solid rgba(16,185,129,0.5)" : "1px solid rgba(234,179,8,0.5)",
                            color: r.status === "approved" ? "rgb(110 231 183)" : "rgb(253 224 71)",
                          }}
                        >
                          {r.status === "approved" ? "Approved" : "Pending"}
                        </div>
                      </div>
                      {r.status === "pending" ? (
                        <button
                          onClick={() => setRegistrations((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "approved" } : x)))}
                          className="h-9 rounded-md bg-emerald-500 px-4 text-sm font-semibold text-black transition hover:bg-emerald-400"
                        >
                          Approve
                        </button>
                      ) : (
                        <div className="text-[11px] text-cyan-200/70">Already approved</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </>
        ) : activeTab === "census" ? (
          <>
            <h2 className="mt-6 orbitron text-lg">Attendance Census</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-cyan-400/25 bg-[#071015]/70 p-5 neon-panel">
                <div className="text-[11px] text-cyan-200/70">Total Members</div>
                <div className="mt-2 text-2xl text-cyan-300">{totalMembers}</div>
              </div>
              <div className="rounded-xl border border-cyan-400/25 bg-[#071015]/70 p-5 neon-panel">
                <div className="text-[11px] text-cyan-200/70">Total Events</div>
                <div className="mt-2 text-2xl text-cyan-300">{totalEvents}</div>
              </div>
              <div className="rounded-xl border border-cyan-400/25 bg-[#071015]/70 p-5 neon-panel">
                <div className="text-[11px] text-cyan-200/70">Total Attendance</div>
                <div className="mt-2 text-2xl text-cyan-300">{totalAttendance}</div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-cyan-400/25 bg-[#071015]/70 p-4 neon-panel">
              <div className="orbitron text-sm">Event Attendance Summary</div>
              <div className="mt-3 space-y-3">
                {events.map((ev) => {
                  const count = attendeesFor(ev.id).length;
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setOpenAttendeesFor(ev.id)}
                      className="group flex w-full items-center justify-between rounded-lg border border-cyan-400/20 bg-[#06121a]/80 px-4 py-3 text-left transition hover:border-cyan-300/50 hover:bg-[#06131c]"
                    >
                      <div>
                        <div className="orbitron text-[13px] text-cyan-100">{ev.title}</div>
                        <div className="text-[10px] text-cyan-200/70">{ev.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] text-cyan-300">{count}</div>
                        <div className="text-[10px] text-cyan-200/70">Attendees</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-6 orbitron text-lg">Reports</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <button onClick={() => setOpenReport("attendance")} className="rounded-xl border border-cyan-400/25 bg-[#071015]/70 p-5 neon-panel text-left transition hover:border-cyan-300/50">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-cyan-300">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                      <path d="M3 3v18h18" />
                      <path d="M7 15l3-3 3 3 4-4 2 2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="orbitron text-[15px]">Attendance Report</div>
                    <div className="text-[12px] text-cyan-200/70">View detailed attendance statistics and trends</div>
                  </div>
                </div>
              </button>
              <button onClick={() => setOpenReport("member")} className="rounded-xl border border-cyan-400/25 bg-[#071015]/70 p-5 neon-panel text-left transition hover:border-cyan-300/50">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-cyan-300">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                      <path d="M16 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4zM8 13c2.21 0 4 2.015 4 4.5V21H4v-3.5C4 15.015 5.79 13 8 13z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="orbitron text-[15px]">Member Report</div>
                    <div className="text-[12px] text-cyan-200/70">Generate member activity and engagement reports</div>
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Create/Edit Modal */}
        <Modal
          open={openForm}
          onClose={() => setOpenForm(false)}
          title={editingId == null ? "Create Event" : "Edit Event"}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              error={errors.title}
              placeholder="Tech Talk: AI & ML"
            />
            <Input
              label="Date"
              type="date"
              value={draft.date}
              onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              error={errors.date}
            />
            <Input
              label="Location"
              value={draft.location}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              error={errors.location}
              placeholder="Room 101"
            />
            <div>
              <label className="mb-1 block text-xs text-cyan-200/80">Badge Emoji</label>
              <div className="flex items-center gap-2">
                <input
                  value={draft.badgeEmoji}
                  onChange={(e) => setDraft((d) => ({ ...d, badgeEmoji: e.target.value }))}
                  placeholder="e.g., 🏅, 🚀, 🤖"
                  className={`h-10 w-full rounded-md bg-transparent px-3 text-sm outline-none placeholder:text-cyan-200/50 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 ${errors.badgeEmoji ? "border border-red-500/60" : "border border-cyan-400/40"}`}
                />
                <button
                  type="button"
                  onClick={() => setEmojiOpen((v) => !v)}
                  className="h-10 shrink-0 rounded-md border border-cyan-400/30 bg-black/30 px-3 text-sm text-cyan-100/90 hover:border-cyan-300/60"
                >
                  {emojiOpen ? "Hide" : "Pick"}
                </button>
              </div>
              {errors.badgeEmoji ? (
                <div className="mt-1 text-[11px] text-red-300">{errors.badgeEmoji}</div>
              ) : null}
              {emojiOpen ? (
                <EmojiPicker
                  onSelect={(e) => {
                    setDraft((d) => ({ ...d, badgeEmoji: e }));
                    setEmojiOpen(false);
                  }}
                />
              ) : null}
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-cyan-200/80">Event Details (also used as Badge details)</label>
              <textarea
                value={draft.details}
                onChange={(e) => setDraft((d) => ({ ...d, details: e.target.value }))}
                placeholder="Describe the event: agenda, venue, speakers, etc."
                className={`min-h-[88px] w-full rounded-md bg-transparent p-3 text-sm outline-none placeholder:text-cyan-200/50 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30 ${errors.details ? "border border-red-500/60" : "border border-cyan-400/40"}`}
              />
              {errors.details ? (
                <div className="mt-1 text-[11px] text-red-300">{errors.details}</div>
              ) : null}
            </div>
            <Input
              label="Attendees"
              type="number"
              value={draft.attendees?.toString() ?? "0"}
              onChange={(e) => setDraft((d) => ({ ...d, attendees: Number(e.target.value) }))}
              error={errors.attendees}
              min={0}
            />
          </div>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={() => setOpenForm(false)}
              className="h-10 rounded-md border border-cyan-400/40 px-4 text-sm text-cyan-100/90 transition hover:border-cyan-300/60"
            >
              Cancel
            </button>
            <Button className="w-auto" onClick={submitDraft}>
              {editingId == null ? "Create" : "Save Changes"}
            </Button>
          </div>
        </Modal>

        {/* Delete confirm */}
        <Modal open={openDeleteId != null} onClose={() => setOpenDeleteId(null)} title="Delete Event">
          <p className="text-sm text-cyan-100/80">
            Are you sure you want to delete this event? This action cannot be undone.
          </p>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={() => setOpenDeleteId(null)}
              className="h-10 rounded-md border border-cyan-400/40 px-4 text-sm text-cyan-100/90 transition hover:border-cyan-300/60"
            >
              Cancel
            </button>
            <button
              onClick={doDelete}
              className="h-10 rounded-md border border-red-400/60 bg-red-500/20 px-4 text-sm text-red-200 transition hover:bg-red-500/30"
            >
              Delete
            </button>
          </div>
        </Modal>
      </div>

      {/* Attendees modal */}
      <Modal open={openAttendeesFor != null} onClose={() => setOpenAttendeesFor(null)} title="Event Attendees">
        {openAttendeesFor != null ? (
          <div className="max-h-[60vh] overflow-auto rounded-lg border border-cyan-400/15 bg-black/30 p-3">
            <ul className="space-y-2 text-sm">
              {attendeesFor(openAttendeesFor).map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-md border border-cyan-400/10 bg-black/30 px-3 py-2">
                  <div>
                    <div className="text-cyan-100">{m.name}</div>
                    <div className="text-[10px] text-cyan-200/70">{m.id}</div>
                  </div>
                  <div className="text-[12px] text-cyan-300">{m.chapter ?? "—"}</div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Modal>

      {/* Reports: Attendance */}
      <Modal open={openReport === "attendance"} onClose={() => setOpenReport(null)} title="Attendance Report">
        {openReport === "attendance" ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <label className="text-[12px] text-cyan-200/80">Event</label>
                <select
                  value={reportEventId ?? ""}
                  onChange={(e) => setReportEventId(e.target.value ? Number(e.target.value) : null)}
                  className="h-9 rounded-md border border-cyan-400/30 bg-transparent px-2 text-sm outline-none focus:border-cyan-300"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id} className="bg-[#0b0f13]">
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={attendeeQuery}
                  onChange={(e) => setAttendeeQuery(e.target.value)}
                  placeholder="Search attendee…"
                  className="h-9 w-[220px] rounded-md border border-cyan-400/30 bg-transparent px-3 text-sm outline-none placeholder:text-cyan-200/50 focus:border-cyan-300"
                />
                <button
                  onClick={() => {
                    const ev = events.find((e) => e.id === (reportEventId ?? 0));
                    if (!ev) return;
                    const rows = attendeesFor(ev.id).map((m) => ({
                      event: ev.title,
                      date: ev.date,
                      memberId: m.id,
                      name: m.name,
                      chapter: m.chapter ?? "",
                    }));
                    if (rows.length > 0) downloadCSV(`attendance-${ev.id}.csv`, rows);
                  }}
                  className="h-9 rounded-md border border-cyan-400/40 px-3 text-sm text-cyan-100/90 transition hover:border-cyan-300/60"
                >
                  Export CSV
                </button>
              </div>
            </div>

            {reportEventId != null ? (
              <div className="max-h-[50vh] overflow-auto rounded-lg border border-cyan-400/15 bg-black/30 p-3">
                <ul className="space-y-2 text-sm">
                  {attendeesFor(reportEventId)
                    .filter((m) =>
                      attendeeQuery
                        ? m.name.toLowerCase().includes(attendeeQuery.toLowerCase()) ||
                          m.id.toLowerCase().includes(attendeeQuery.toLowerCase())
                        : true
                    )
                    .map((m) => (
                      <li key={m.id} className="flex items-center justify-between rounded-md border border-cyan-400/10 bg-black/30 px-3 py-2">
                        <div>
                          <div className="text-cyan-100">{m.name}</div>
                          <div className="text-[10px] text-cyan-200/70">{m.id}</div>
                        </div>
                        <div className="text-[12px] text-cyan-300">{m.chapter ?? "—"}</div>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {/* Reports: Member */}
      <Modal open={openReport === "member"} onClose={() => setOpenReport(null)} title="Member Report">
        {openReport === "member" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-[12px] text-cyan-200/80">Chapter</label>
              <select
                value={chapterFilter}
                onChange={(e) => setChapterFilter(e.target.value)}
                className="h-9 rounded-md border border-cyan-400/30 bg-transparent px-2 text-sm outline-none focus:border-cyan-300"
              >
                {chapters.map((c) => (
                  <option key={c} value={c} className="bg-[#0b0f13]">
                    {c === "all" ? "All Chapters" : c}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const rows = engagement
                    .filter((e) => (chapterFilter === "all" ? true : (e.member.chapter ?? "") === chapterFilter))
                    .map((e) => ({ id: e.member.id, name: e.member.name, chapter: e.member.chapter ?? "", events: e.count }));
                  if (rows.length > 0) downloadCSV("member-engagement.csv", rows);
                }}
                className="h-9 rounded-md border border-cyan-400/40 px-3 text-sm text-cyan-100/90 transition hover:border-cyan-300/60"
              >
                Export CSV
              </button>
            </div>

            <div className="max-h-[50vh] overflow-auto rounded-lg border border-cyan-400/15 bg-black/30 p-3">
              <ul className="space-y-2 text-sm">
                {engagement
                  .filter((e) => (chapterFilter === "all" ? true : (e.member.chapter ?? "") === chapterFilter))
                  .slice(0, 100)
                  .map((e) => (
                    <li key={e.member.id} className="flex items-center justify-between rounded-md border border-cyan-400/10 bg-black/30 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-cyan-100">{e.member.name}</div>
                        <div className="text-[10px] text-cyan-200/70">{e.member.id}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-[12px] text-cyan-300">{e.member.chapter ?? "—"}</div>
                        <div className="min-w-[60px] rounded-md bg-cyan-400/10 px-2 py-1 text-center text-[12px] text-cyan-200">
                          {e.count} events
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
