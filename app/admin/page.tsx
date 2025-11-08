"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/app/lib/client-auth";
import {
  userAPI,
  memberAPI,
  authAPI,
  type User,
  type Member,
  type UserRequest,
  type UserResponse
} from "@/app/lib/api";
// Keep dummy data for events for now
import eventsData from "@/app/data/events.json";
import attendanceData from "@/app/data/attendance.json";
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

  // Prevent hydration mismatch by ensuring client-only rendering
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Local state for events (keep using dummy data for now)
  const [events, setEvents] = React.useState<AdminEvent[]>([]);
  const [users, setUsers] = React.useState<UserResponse[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = React.useState<boolean | null>(null);
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
  const [activeTab, setActiveTab] = React.useState<"events" | "members" | "approvals" | "census" | "reports">("events");
  const [openAttendeesFor, setOpenAttendeesFor] = React.useState<number | null>(null);
  const [openReport, setOpenReport] = React.useState<null | "attendance" | "member">(null);
  const [reportEventId, setReportEventId] = React.useState<number | null>(null);
  const [attendeeQuery, setAttendeeQuery] = React.useState("");
  const [chapterFilter, setChapterFilter] = React.useState("all");

  // User edit modal state
  const [editingUserId, setEditingUserId] = React.useState<number | null>(null);
  const [openUserForm, setOpenUserForm] = React.useState(false);
  const [userDraft, setUserDraft] = React.useState<UserRequest>({
    firstName: "",
    lastName: "",
    age: 18,
    username: "",
    password: "",
    role: "MEMBER",
    memberId: "",
    schoolId: undefined
  });
  const [userErrors, setUserErrors] = React.useState<Record<string, string>>({});
  const [deleteUserId, setDeleteUserId] = React.useState<number | null>(null);

  // Load users and members from backend, keep events as dummy data for now
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to load users from backend
        try {
          const usersData = await userAPI.getAllUsers();
          setUsers(usersData);
          setBackendAvailable(true);

          // Filter members from users (users with role "MEMBER")
          const membersFromUsers = usersData.filter(user => user.role === 'MEMBER') as Member[];
          setMembers(membersFromUsers);
        } catch (apiErr) {
          console.warn('Backend API not available, using fallback data:', apiErr);
          setBackendAvailable(false);

          // Fallback to empty data with a warning
          setUsers([]);
          setMembers([]);
          setError('Backend server not available. Using offline mode. Start your Spring Boot server to enable full functionality.');
        }

        // Load events from dummy data for now
        setEvents(eventsData as AdminEvent[]);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to initialize admin dashboard. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Registrations state (separate from users - these are applications)
  type Registration = { id: number; name: string; email: string; chapter?: string; status: "pending" | "approved"; submittedAt?: string };
  const [registrations, setRegistrations] = React.useState<Registration[]>([
    // Mock pending applications for demonstration
    {
      id: 1001,
      name: "Maria Santos",
      email: "maria.santos@example.com",
      chapter: "UP Manila",
      status: "pending",
      submittedAt: "2025-11-08"
    },
    {
      id: 1002,
      name: "Juan Dela Cruz",
      email: "juan.delacruz@example.com",
      chapter: "PUP Manila",
      status: "pending",
      submittedAt: "2025-11-07"
    },
    {
      id: 1003,
      name: "Anna Garcia",
      email: "anna.garcia@example.com",
      chapter: "UST",
      status: "approved",
      submittedAt: "2025-11-06"
    }
  ]);

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
  type LocalMember = { id: string; name: string; chapter?: string };
  const memberIndex = React.useMemo(() => {
    const idx = new Map<string, LocalMember>();
    for (const m of members) {
      const localMember: LocalMember = {
        id: m.memberId || String(m.id),
        name: `${m.firstName} ${m.lastName}`,
        chapter: m.school?.name
      };
      idx.set(m.memberId || String(m.id), localMember);
    }
    return idx;
  }, [members]);

  // Attendance map using dummy data for now
  const attendanceMap = React.useMemo(() => {
    return attendanceData as Record<string, string[]>;
  }, []);

  const totalMembers = members.length;
  const totalEvents = events.length;
  const totalAttendance = React.useMemo(() => {
    let sum = 0;
    for (const e of events) {
      const arr = attendanceMap[String(e.id)] ?? [];
      sum += arr.length;
    }
    return sum;
  }, [events, attendanceMap]);

  function attendeesFor(eventId: number): LocalMember[] {
    const memberIds = attendanceMap[String(eventId)] ?? [];
    return memberIds.map((id) => memberIndex.get(id) ?? { id, name: id, chapter: "Unknown" });
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
    for (const m of members) if (m.school?.name) set.add(m.school.name);
    return ["all", ...Array.from(set)];
  }, [members]);

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

  // User management functions
  function openCreateUser() {
    setEditingUserId(null);
    setUserDraft({
      firstName: "",
      lastName: "",
      age: 18,
      username: "",
      password: "",
      role: "MEMBER",
      memberId: "",
      schoolId: undefined
    });
    setUserErrors({});
    setOpenUserForm(true);
  }

  function openEditUser(user: UserResponse) {
    setEditingUserId(user.id);
    setUserDraft({
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      username: user.username,
      password: "", // Don't populate password for security
      role: user.role as "ADMIN" | "MEMBER" | "SCANNER",
      memberId: user.memberId || "",
      schoolId: user.school?.id
    });
    setUserErrors({});
    setOpenUserForm(true);
  }

  function validateUser(d: UserRequest) {
    const next: Record<string, string> = {};
    if (!d.firstName?.trim()) next.firstName = "Required";
    if (!d.lastName?.trim()) next.lastName = "Required";
    if (!d.username?.trim()) next.username = "Required";
    if (editingUserId === null && !d.password?.trim()) next.password = "Required for new users";
    if (d.age < 1 || d.age > 150) next.age = "Invalid age";
    if (d.role === "MEMBER" && !d.memberId?.trim()) next.memberId = "Required for members";
    setUserErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submitUser() {
    if (!validateUser(userDraft)) return;

    try {
      setLoading(true);

      if (editingUserId === null) {
        // Create new user
        const newUser = await userAPI.createUser(userDraft);
        setUsers(prev => [newUser, ...prev]);
      } else {
        // Update existing user
        const updatedUser = await userAPI.updateUser(editingUserId, userDraft);
        setUsers(prev => prev.map(u => u.id === editingUserId ? updatedUser : u));
      }

      setOpenUserForm(false);
    } catch (err) {
      console.error('Failed to save user:', err);
      setError(`Failed to ${editingUserId === null ? 'create' : 'update'} user. Please try again.`);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDeleteUser(userId: number) {
    try {
      setLoading(true);
      await userAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setDeleteUserId(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Prevent hydration errors
  if (!mounted) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="relative min-h-dvh isolate overflow-hidden flex items-center justify-center" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh isolate overflow-hidden transition-colors duration-300" style={{ background: "var(--background)", color: "var(--foreground)" }}>
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

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        {/* Top bar */}
        <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm animate-fade-in transition-all duration-300" style={{ background: "var(--card-bg)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/ICpEP.SE Logo.png" alt="logo" width={28} height={28} />
              <div>
                <div className="orbitron text-lg leading-none text-cyan-400">Admin Dashboard</div>
                <div className="flex items-center gap-2">
                  <div className="text-[10px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>ICpEP NCR Management</div>
                  {backendAvailable !== null && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] ${backendAvailable
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${backendAvailable ? 'bg-green-400' : 'bg-orange-400'}`} />
                      {backendAvailable ? 'Backend Connected' : 'Offline Mode'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                try {
                  authAPI.removeAuthToken();
                  window.localStorage.removeItem("icpep-user");
                } catch { }
                router.push("/auth/login");
              }}
              className="h-8 rounded-md border border-cyan-400/40 px-3 text-[11px] transition-all duration-200 hover:border-cyan-300/60 hover:scale-105 active:scale-95 cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
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
                  "h-8 rounded-full px-4 text-[11px] cursor-pointer transition-all duration-300 " +
                  (activeTab === "events"
                    ? "border border-cyan-400/30 bg-cyan-400 text-black font-semibold orbitron"
                    : "border border-cyan-400/20 hover:border-cyan-400/40")
                }
                style={activeTab === "events" ? {} : { color: "var(--text-secondary)" }}
              >
                Events
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={
                  "h-8 rounded-full px-4 text-[11px] cursor-pointer transition-all duration-300 " +
                  (activeTab === "members"
                    ? "border border-cyan-400/30 bg-cyan-400 text-black font-semibold orbitron"
                    : "border border-cyan-400/20 hover:border-cyan-400/40")
                }
                style={activeTab === "members" ? {} : { color: "var(--text-secondary)" }}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab("approvals")}
                className={
                  "h-8 rounded-full px-4 text-[11px] cursor-pointer transition-all duration-300 flex items-center gap-2 " +
                  (activeTab === "approvals"
                    ? "border border-cyan-400/30 bg-cyan-400 text-black font-semibold orbitron"
                    : "border border-cyan-400/20 hover:border-cyan-400/40")
                }
                style={activeTab === "approvals" ? {} : { color: "var(--text-secondary)" }}
              >
                Approvals
                {registrations.filter(r => r.status === "pending").length > 0 && (
                  <span className={`inline-flex items-center justify-center w-5 h-5 text-[9px] font-bold rounded-full ${activeTab === "approvals" ? "bg-red-500 text-white" : "bg-yellow-500 text-black"
                    }`}>
                    {registrations.filter(r => r.status === "pending").length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("census")}
                className={
                  "h-8 rounded-full px-4 text-[11px] cursor-pointer transition-all duration-300 " +
                  (activeTab === "census"
                    ? "border border-cyan-400/30 bg-cyan-400 text-black font-semibold orbitron"
                    : "border border-cyan-400/20 hover:border-cyan-400/40")
                }
                style={activeTab === "census" ? {} : { color: "var(--text-secondary)" }}
              >
                Census
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={
                  "h-8 rounded-full px-4 text-[11px] cursor-pointer transition-all duration-300 " +
                  (activeTab === "reports"
                    ? "border border-cyan-400/30 bg-cyan-400 text-black font-semibold orbitron"
                    : "border border-cyan-400/20 hover:border-cyan-400/40")
                }
                style={activeTab === "reports" ? {} : { color: "var(--text-secondary)" }}
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
                    className="h-8 w-[220px] rounded-md border border-cyan-400/30 px-3 text-[11px] outline-none placeholder:text-cyan-200/50 focus:border-cyan-300 transition-all duration-300"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                    }}
                  />
                </div>
                <button
                  onClick={openCreate}
                  className="h-8 rounded-md bg-teal-500/90 px-3 text-[11px] font-semibold text-black transition hover:bg-teal-400 cursor-pointer"
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
                    placeholder="Search users…"
                    className="h-8 w-[220px] rounded-md border border-cyan-400/30 px-3 text-[11px] outline-none placeholder:text-cyan-200/50 focus:border-cyan-300 transition-all duration-300"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                    }}
                  />
                </div>
                <button
                  onClick={openCreateUser}
                  className="h-8 rounded-md bg-teal-500/90 px-3 text-[11px] font-semibold text-black transition hover:bg-teal-400 cursor-pointer"
                >
                  + Create User
                </button>
              </div>
            ) : activeTab === "approvals" ? (
              <div className="flex items-center gap-2">
                <div className="hidden md:block">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search applications…"
                    className="h-8 w-[220px] rounded-md border border-cyan-400/30 px-3 text-[11px] outline-none placeholder:text-cyan-200/50 focus:border-cyan-300 transition-all duration-300"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                    }}
                  />
                </div>
                <button
                  onClick={async () => {
                    try {
                      const nextId = Math.max(0, ...users.map((u) => u.id)) + 1;
                      const newUser = await userAPI.createUser({
                        firstName: 'Pending',
                        lastName: 'Applicant',
                        age: 22,
                        username: `applicant${nextId}`,
                        password: 'temp123',
                        role: 'MEMBER',
                        memberId: `ICPEP-2025-${String(nextId + 100).padStart(3, '0')}`,
                      });

                      setUsers(prev => [newUser, ...prev]);
                    } catch (err) {
                      console.error('Failed to create applicant:', err);
                      setError('Failed to create new applicant');
                    }
                  }}
                  className="h-8 rounded-md border border-cyan-400/40 px-3 text-[11px] transition hover:border-cyan-300/60 cursor-pointer"
                  style={{ color: "var(--text-secondary)" }}
                >
                  + Add Test Applicant
                </button>
              </div>
            ) : (
              <div className="hidden md:block" />
            )}
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-400/30 bg-red-900/20 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-300 hover:text-red-100 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        ) : null}

        {!isAdmin ? (
          <div className="mt-6 rounded-xl border border-yellow-400/30 bg-yellow-900/20 p-4 text-sm">
            Access restricted. This page is for admin role accounts. Please log in as an admin user.
          </div>
        ) : null}

        {activeTab === "events" ? (
          <>
            <h2 className="mt-6 text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Manage Events</h2>
            <div className="mt-3 space-y-4">
              {filtered.map((ev, idx) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-cyan-400/25 p-4 shadow-[0_0_0_1px_rgba(34,211,238,0.08)_inset] neon-panel transition-all duration-300 hover:scale-[1.01] animate-slide-up"
                  style={{ background: "var(--card-bg)", animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="grid w-full grid-cols-2 gap-x-10 gap-y-1 md:grid-cols-4">
                      <div>
                        <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Title</div>
                        <div className="orbitron text-sm text-cyan-400">{ev.title}</div>
                      </div>
                      <div>
                        <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Date</div>
                        <div className="text-sm transition-colors duration-300" style={{ color: "var(--text-primary)" }}>{ev.date}</div>
                      </div>
                      <div>
                        <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Location</div>
                        <div className="text-sm transition-colors duration-300" style={{ color: "var(--text-primary)" }}>{ev.location}</div>
                      </div>
                      <div>
                        <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Attendees</div>
                        <div className="text-sm text-emerald-400">{ev.attendees}</div>
                      </div>
                      <div className="md:col-span-4">
                        <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Badge</div>
                        <div className="text-sm transition-colors duration-300" style={{ color: "var(--text-primary)" }}>{ev.badgeEmoji ? `${ev.badgeEmoji} ${ev.title}` : "—"}</div>
                        {ev.details ? (
                          <div className="mt-1 text-[12px] line-clamp-2 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{ev.details}</div>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-stretch md:self-auto">
                      <button
                        title="Edit"
                        onClick={() => openEdit(ev.id)}
                        className="cursor-pointer grid h-9 w-9 place-content-center rounded-md border border-cyan-400/30 transition-all duration-200 hover:border-cyan-300/60 hover:scale-110 active:scale-95"
                        style={{ background: "var(--input-bg)", color: "var(--text-primary)" }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                          <path d="M16.862 3.487a1.5 1.5 0 0 1 2.121 2.121L8.25 16.34 4.5 17.25l.91-3.75L16.862 3.487Z" />
                        </svg>
                      </button>
                      <button
                        title="Delete"
                        onClick={() => confirmDelete(ev.id)}
                        className="cursor-pointer grid h-9 w-9 place-content-center rounded-md border border-red-400/40 bg-red-950/40 text-red-300 transition-all duration-200 hover:border-red-300/70 hover:scale-110 active:scale-95"
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
            <h2 className="mt-6 orbitron text-lg text-cyan-400">User Management</h2>

            {/* Users Table */}
            <div className="mt-4 rounded-xl border border-cyan-400/25 overflow-hidden shadow-[0_0_0_1px_rgba(34,211,238,0.08)_inset] neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)" }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-cyan-400/20" style={{ background: "rgba(34,211,238,0.05)" }}>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider orbitron">Name</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider orbitron">Username</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider orbitron">Role</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider orbitron">School</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider orbitron">Member ID</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-cyan-300 uppercase tracking-wider orbitron">Age</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-cyan-300 uppercase tracking-wider orbitron">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyan-400/10">
                    {users
                      .filter((user) =>
                        query
                          ? `${user.firstName} ${user.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
                          user.username.toLowerCase().includes(query.toLowerCase()) ||
                          user.role.toLowerCase().includes(query.toLowerCase())
                          : true
                      )
                      .map((user, idx) => (
                        <tr key={user.id ?? `temp-${idx}`} className="hover:bg-cyan-400/5 transition-colors duration-200 animate-slide-up" style={{ animationDelay: `${idx * 0.02}s` }}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 flex items-center justify-center mr-3 border border-cyan-400/30">
                                <span className="text-xs font-bold text-cyan-300 orbitron">
                                  {user.firstName[0]}{user.lastName[0]}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium orbitron transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                                  {user.firstName} {user.lastName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono bg-cyan-400/10 px-2 py-1 rounded border border-cyan-400/20 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                              @{user.username}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full orbitron transition-all duration-300 ${user.role === 'ADMIN'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                              : user.role === 'MEMBER'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                              }`}>
                              {user.role === 'ADMIN' && '👑 '}
                              {user.role === 'MEMBER' && '🎓 '}
                              {user.role === 'SCANNER' && '📱 '}
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                              {user.school?.name || (
                                <span className="text-xs italic opacity-60">No school</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.role === 'MEMBER' && user.memberId ? (
                              <div className="text-sm font-mono bg-cyan-400/10 px-2 py-1 rounded border border-cyan-400/20 text-cyan-300">
                                {user.memberId}
                              </div>
                            ) : (
                              <span className="text-xs italic opacity-60">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm bg-gray-500/10 px-2 py-1 rounded border border-gray-500/20 text-center w-12 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                              {user.age}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                title="Edit User"
                                onClick={() => openEditUser(user)}
                                className="cursor-pointer grid h-9 w-9 place-content-center rounded-md border border-cyan-400/30 transition-all duration-200 hover:border-cyan-300/60 hover:scale-110 active:scale-95"
                                style={{ background: "var(--input-bg)", color: "var(--text-primary)" }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                                  <path d="M16.862 3.487a1.5 1.5 0 0 1 2.121 2.121L8.25 16.34 4.5 17.25l.91-3.75L16.862 3.487Z" />
                                </svg>
                              </button>
                              <button
                                title="Delete User"
                                onClick={() => setDeleteUserId(user.id)}
                                className="cursor-pointer grid h-9 w-9 place-content-center rounded-md border border-red-400/40 bg-red-950/40 text-red-300 transition-all duration-200 hover:border-red-300/70 hover:scale-110 active:scale-95"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                                  <path d="M6 7h12M9 7v10m6-10v10M4 7h16l-1 13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 7Zm4-3h8l1 3H7l1-3Z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="text-4xl opacity-50">👥</div>
                            <div className="text-sm font-medium transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                              {backendAvailable === false ? 'No Connection' : 'No Users'}
                            </div>
                            <div className="text-xs transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                              {backendAvailable === false
                                ? 'Backend server not connected. Users will appear here when connected.'
                                : 'No users found. Click "Add User" to create the first user.'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : activeTab === "approvals" ? (
          <>
            <h2 className="mt-6 orbitron text-lg text-cyan-400">Member Applications</h2>
            <p className="mt-2 text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
              Review and approve new member registration applications
            </p>

            {/* Pending Applications */}
            <div className="mt-4 space-y-4">
              {registrations
                .filter((r) =>
                  query
                    ? r.name.toLowerCase().includes(query.toLowerCase()) ||
                    r.email.toLowerCase().includes(query.toLowerCase())
                    : true
                )
                .map((r, idx) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-cyan-400/25 p-6 neon-panel animate-slide-up transition-all duration-300 hover:scale-[1.01]"
                    style={{ background: "var(--card-bg)", animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="orbitron text-lg transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                              {r.name}
                            </h3>
                            <p className="text-sm transition-colors duration-300 mt-1" style={{ color: "var(--text-secondary)" }}>
                              {r.email}
                            </p>
                          </div>
                          <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: r.status === "approved" ? "rgb(5 150 105 / 0.2)" : "rgb(234 179 8 / 0.15)",
                              border: r.status === "approved" ? "1px solid rgba(16,185,129,0.5)" : "1px solid rgba(234,179,8,0.5)",
                              color: r.status === "approved" ? "rgb(110 231 183)" : "rgb(253 224 71)",
                            }}
                          >
                            {r.status === "approved" ? "✓ Approved" : "⏳ Pending Review"}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-xs transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>School/Chapter</span>
                            <div className="mt-1 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                              {r.chapter || 'Not specified'}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Application ID</span>
                            <div className="mt-1 font-mono text-cyan-300">
                              #{String(r.id).padStart(4, '0')}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Status</span>
                            <div className="mt-1 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                              {r.status === "approved" ? "Account Created" : "Awaiting Approval"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        {r.status === "pending" ? (
                          <>
                            <button
                              onClick={async () => {
                                try {
                                  // Update the registration status
                                  setRegistrations((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: "approved" } : x)));

                                  // In a real app, you might want to:
                                  // 1. Send approval email
                                  // 2. Create member record
                                  // 3. Generate member ID and credentials

                                } catch (err) {
                                  console.error('Failed to approve application:', err);
                                  setError('Failed to approve application');
                                }
                              }}
                              className="cursor-pointer flex items-center gap-2 h-10 rounded-md bg-emerald-500 px-4 text-sm font-semibold text-black transition-all duration-200 hover:bg-emerald-400 active:scale-95"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to reject the application from ${r.name}?`)) {
                                  setRegistrations((prev) => prev.filter((x) => x.id !== r.id));
                                }
                              }}
                              className="cursor-pointer flex items-center gap-2 h-10 rounded-md border border-red-400/40 bg-red-950/40 px-4 text-sm text-red-300 transition-all duration-200 hover:bg-red-500/30 active:scale-95"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Reject
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2 text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Application Processed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {registrations.length === 0 && (
                <div className="text-center py-12 rounded-xl border border-cyan-400/25 neon-panel" style={{ background: "var(--card-bg)" }}>
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="orbitron text-lg text-cyan-400 mb-2">No Applications</h3>
                  <p className="text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                    {backendAvailable === false
                      ? 'Backend server not connected. Applications will appear here when users register.'
                      : 'No pending member applications at this time.'}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : activeTab === "census" ? (
          <>
            <h2 className="mt-6 orbitron text-lg text-cyan-400">Attendance Census</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-cyan-400/25 p-5 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)", animationDelay: "0s" }}>
                <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Total Members</div>
                <div className="mt-2 text-2xl text-cyan-300">{totalMembers}</div>
              </div>
              <div className="rounded-xl border border-cyan-400/25 p-5 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)", animationDelay: "0.05s" }}>
                <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Total Events</div>
                <div className="mt-2 text-2xl text-cyan-300">{totalEvents}</div>
              </div>
              <div className="rounded-xl border border-cyan-400/25 p-5 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)", animationDelay: "0.1s" }}>
                <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Total Attendance</div>
                <div className="mt-2 text-2xl text-cyan-300">{totalAttendance}</div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)", animationDelay: "0.15s" }}>
              <div className="orbitron text-sm text-cyan-400">Event Attendance Summary</div>
              <div className="mt-3 space-y-3">
                {events.map((ev) => {
                  const count = attendeesFor(ev.id).length;
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setOpenAttendeesFor(ev.id)}
                      className="cursor-pointer group flex w-full items-center justify-between rounded-lg border border-cyan-400/20 px-4 py-3 text-left transition-all duration-200 hover:border-cyan-400/30 hover:scale-[1.005] active:scale-[0.98]"
                      style={{ background: "var(--input-bg)" }}
                    >
                      <div>
                        <div className="orbitron text-[13px] transition-colors duration-300" style={{ color: "var(--text-primary)" }}>{ev.title}</div>
                        <div className="text-[10px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{ev.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] text-cyan-300">{count}</div>
                        <div className="text-[10px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Attendees</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="mt-6 orbitron text-lg text-cyan-400">Reports</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <button
                onClick={() => setOpenReport("attendance")}
                className="cursor-pointer rounded-xl border border-cyan-400/25 p-5 neon-panel text-left transition-all duration-300 hover:border-cyan-300/50 hover:scale-[1.02] active:scale-95 animate-slide-up"
                style={{ background: "var(--card-bg)", animationDelay: "0s" }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-cyan-300">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                      <path d="M3 3v18h18" />
                      <path d="M7 15l3-3 3 3 4-4 2 2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="orbitron text-[15px] transition-colors duration-300" style={{ color: "var(--text-primary)" }}>Attendance Report</div>
                    <div className="text-[12px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>View detailed attendance statistics and trends</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setOpenReport("member")}
                className="cursor-pointer rounded-xl border border-cyan-400/25 p-5 neon-panel text-left transition-all duration-300 hover:border-cyan-300/50 hover:scale-[1.02] active:scale-95 animate-slide-up"
                style={{ background: "var(--card-bg)", animationDelay: "0.05s" }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-cyan-300">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                      <path d="M16 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4zM8 13c2.21 0 4 2.015 4 4.5V21H4v-3.5C4 15.015 5.79 13 8 13z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="orbitron text-[15px] transition-colors duration-300" style={{ color: "var(--text-primary)" }}>Member Report</div>
                    <div className="text-[12px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Generate member activity and engagement reports</div>
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
              <label className="mb-1 block text-xs transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Badge Emoji</label>
              <div className="flex items-center gap-2">
                <input
                  value={draft.badgeEmoji}
                  onChange={(e) => setDraft((d) => ({ ...d, badgeEmoji: e.target.value }))}
                  placeholder="e.g., 🏅, 🚀, 🤖"
                  className={`h-10 w-full rounded-md px-3 text-sm outline-none focus:ring-2 focus:ring-cyan-400/30 transition-colors duration-300 ${errors.badgeEmoji ? "border border-red-500/60" : "border"}`}
                  style={{
                    background: "var(--input-bg)",
                    color: "var(--input-text)",
                    borderColor: errors.badgeEmoji ? undefined : "var(--input-border)"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setEmojiOpen((v) => !v)}
                  className="cursor-pointer h-10 shrink-0 rounded-md border border-cyan-400/30 px-3 text-sm transition-all duration-200 hover:border-cyan-300/60 active:scale-95"
                  style={{ background: "var(--input-bg)", color: "var(--text-primary)" }}
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
              <label className="mb-1 block text-xs transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Event Details (also used as Badge details)</label>
              <textarea
                value={draft.details}
                onChange={(e) => setDraft((d) => ({ ...d, details: e.target.value }))}
                placeholder="Describe the event: agenda, venue, speakers, etc."
                className={`min-h-[88px] w-full rounded-md p-3 text-sm outline-none focus:ring-2 focus:ring-cyan-400/30 transition-colors duration-300 ${errors.details ? "border border-red-500/60" : "border"}`}
                style={{
                  background: "var(--input-bg)",
                  color: "var(--input-text)",
                  borderColor: errors.details ? undefined : "var(--input-border)"
                }}
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
              className="cursor-pointer h-10 rounded-md border border-cyan-400/40 px-4 text-sm transition-all duration-200 hover:border-cyan-300/60 active:scale-95"
              style={{ color: "var(--text-primary)" }}
            >
              Cancel
            </button>
            <Button className="w-auto cursor-pointer" onClick={submitDraft}>
              {editingId == null ? "Create" : "Save Changes"}
            </Button>
          </div>
        </Modal>

        {/* Delete confirm */}
        <Modal open={openDeleteId != null} onClose={() => setOpenDeleteId(null)} title="Delete Event">
          <p className="text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
            Are you sure you want to delete this event? This action cannot be undone.
          </p>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={() => setOpenDeleteId(null)}
              className="cursor-pointer h-10 rounded-md border border-cyan-400/40 px-4 text-sm transition-all duration-200 hover:border-cyan-300/60 active:scale-95"
              style={{ color: "var(--text-primary)" }}
            >
              Cancel
            </button>
            <button
              onClick={doDelete}
              className="cursor-pointer h-10 rounded-md border border-red-400/60 bg-red-950/40 px-4 text-sm text-red-200 transition-all duration-200 hover:bg-red-500/30 active:scale-95"
            >
              Delete
            </button>
          </div>
        </Modal>
      </div>

      {/* Attendees modal */}
      <Modal open={openAttendeesFor != null} onClose={() => setOpenAttendeesFor(null)} title="Event Attendees">
        {openAttendeesFor != null ? (
          <div className="max-h-[60vh] overflow-auto rounded-lg border border-cyan-400/15 p-3 transition-colors duration-300" style={{ background: "var(--input-bg)" }}>
            <ul className="space-y-2 text-sm">
              {attendeesFor(openAttendeesFor).map((m, idx) => (
                <li key={`attendee-${openAttendeesFor}-${m.id}-${idx}`} className="flex items-center justify-between rounded-md border border-cyan-400/10 px-3 py-2 transition-colors duration-300" style={{ background: "var(--card-bg)" }}>
                  <div>
                    <div className="text-cyan-400">{m.name}</div>
                    <div className="text-[10px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{m.id}</div>
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
                <label className="text-[12px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Event</label>
                <select
                  value={reportEventId ?? ""}
                  onChange={(e) => setReportEventId(e.target.value ? Number(e.target.value) : null)}
                  className="cursor-pointer h-9 rounded-md border border-cyan-400/30 px-2 text-sm outline-none focus:border-cyan-300 transition-colors duration-300 [&>option]:bg-black dark:[&>option]:bg-black [&>option]:text-cyan-100"
                  style={{ background: "var(--input-bg)", color: "var(--input-text)" }}
                >
                  {events.map((e) => (
                    <option key={`event-option-${e.id}`} value={e.id}>
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
                  className="h-9 w-[220px] rounded-md border px-3 text-sm outline-none focus:border-cyan-300 transition-colors duration-300"
                  style={{ background: "var(--input-bg)", color: "var(--input-text)", borderColor: "var(--input-border)" }}
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
                  className="cursor-pointer h-9 rounded-md border border-cyan-400/40 px-3 text-sm transition-all duration-200 hover:border-cyan-300/60 active:scale-95"
                  style={{ color: "var(--text-primary)" }}
                >
                  Export CSV
                </button>
              </div>
            </div>

            {reportEventId != null ? (
              <div className="max-h-[50vh] overflow-auto rounded-lg border border-cyan-400/15 p-3 transition-colors duration-300" style={{ background: "var(--input-bg)" }}>
                <ul className="space-y-2 text-sm">
                  {attendeesFor(reportEventId)
                    .filter((m) =>
                      attendeeQuery
                        ? m.name.toLowerCase().includes(attendeeQuery.toLowerCase()) ||
                        m.id.toLowerCase().includes(attendeeQuery.toLowerCase())
                        : true
                    )
                    .map((m, idx) => (
                      <li key={`report-attendee-${reportEventId}-${m.id}-${idx}`} className="flex items-center justify-between rounded-md border border-cyan-400/10 px-3 py-2 transition-colors duration-300" style={{ background: "var(--card-bg)" }}>
                        <div>
                          <div className="text-cyan-400">{m.name}</div>
                          <div className="text-[10px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{m.id}</div>
                        </div>
                        <div className="text-[12px] text-cyan-300">{m.chapter ?? "—"}</div>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>        {/* User Edit/Create Modal */}
      <Modal
        open={openUserForm}
        onClose={() => setOpenUserForm(false)}
        title={editingUserId === null ? "Create User" : "Edit User"}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="First Name"
            value={userDraft.firstName}
            onChange={(e) => setUserDraft((d) => ({ ...d, firstName: e.target.value }))}
            error={userErrors.firstName}
            placeholder="John"
          />
          <Input
            label="Last Name"
            value={userDraft.lastName}
            onChange={(e) => setUserDraft((d) => ({ ...d, lastName: e.target.value }))}
            error={userErrors.lastName}
            placeholder="Doe"
          />
          <Input
            label="Username"
            value={userDraft.username}
            onChange={(e) => setUserDraft((d) => ({ ...d, username: e.target.value }))}
            error={userErrors.username}
            placeholder="johndoe"
            disabled={editingUserId !== null}
          />
          <Input
            label="Password"
            type="password"
            value={userDraft.password}
            onChange={(e) => setUserDraft((d) => ({ ...d, password: e.target.value }))}
            error={userErrors.password}
            placeholder={editingUserId !== null ? "Leave empty to keep current" : "Enter password"}
          />
          <Input
            label="Age"
            type="number"
            value={(userDraft.age || 18).toString()}
            onChange={(e) => setUserDraft((d) => ({ ...d, age: parseInt(e.target.value) || 18 }))}
            error={userErrors.age}
            min={1}
            max={150}
          />
          <div>
            <label className="mb-1 block text-xs transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Role</label>
            {editingUserId !== null ? (
              <div 
                className="h-10 w-full rounded-md px-3 text-sm flex items-center border"
                style={{
                  background: "var(--input-bg)",
                  color: "var(--text-secondary)",
                  borderColor: "var(--input-border)",
                  opacity: 0.7
                }}
              >
                {userDraft.role === "ADMIN" ? "Admin" : userDraft.role === "SCANNER" ? "Scanner" : "Member"}
              </div>
            ) : (
              <select
                value={userDraft.role}
                onChange={(e) => setUserDraft((d) => ({ ...d, role: e.target.value as "ADMIN" | "MEMBER" | "SCANNER" }))}
                className={`h-10 w-full rounded-md px-3 text-sm outline-none focus:ring-2 focus:ring-cyan-400/30 transition-colors duration-300 cursor-pointer border ${userErrors.role ? "border-red-500/60" : ""}`}
                style={{
                  background: "var(--input-bg)",
                  color: "var(--input-text)",
                  borderColor: userErrors.role ? undefined : "var(--input-border)"
                }}
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="SCANNER">Scanner</option>
              </select>
            )}
            {userErrors.role && (
              <div className="mt-1 text-[11px] text-red-300">{userErrors.role}</div>
            )}
          </div>
        </div>

        {userDraft.role === "MEMBER" && (
          <div className="mt-4">
            <Input
              label="Member ID"
              value={userDraft.memberId || ""}
              onChange={(e) => setUserDraft((d) => ({ ...d, memberId: e.target.value }))}
              error={userErrors.memberId}
              placeholder="ICPEP-2025-001"
            />
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={() => setOpenUserForm(false)}
            className="cursor-pointer h-10 rounded-md border border-cyan-400/40 px-4 text-sm transition-all duration-200 hover:border-cyan-300/60 active:scale-95"
            style={{ color: "var(--text-primary)" }}
          >
            Cancel
          </button>
          <Button className="w-auto cursor-pointer" onClick={submitUser}>
            {editingUserId === null ? "Create User" : "Save Changes"}
          </Button>
        </div>
      </Modal>

      {/* User Delete Confirmation Modal */}
      <Modal
        open={deleteUserId !== null}
        onClose={() => setDeleteUserId(null)}
        title="Delete User"
      >
        {deleteUserId && (
          <>
            <p className="text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
              Are you sure you want to delete this user? This action cannot be undone and will remove:
            </p>
            <ul className="mt-3 space-y-1 text-sm list-disc list-inside transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
              <li>User account and login credentials</li>
              <li>Member profile and passport data</li>
              <li>All attendance stamps and activity history</li>
            </ul>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteUserId(null)}
                className="cursor-pointer h-10 rounded-md border border-cyan-400/40 px-4 text-sm transition-all duration-200 hover:border-cyan-300/60 active:scale-95"
                style={{ color: "var(--text-primary)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUserId && confirmDeleteUser(deleteUserId)}
                className="cursor-pointer h-10 rounded-md border border-red-400/60 bg-red-950/40 px-4 text-sm text-red-200 transition-all duration-200 hover:bg-red-500/30 active:scale-95"
              >
                Delete User
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Reports: Member */}
      <Modal open={openReport === "member"} onClose={() => setOpenReport(null)} title="Member Report">
        {openReport === "member" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-[12px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Chapter</label>
              <select
                value={chapterFilter}
                onChange={(e) => setChapterFilter(e.target.value)}
                className="cursor-pointer h-9 rounded-md border border-cyan-400/30 px-2 text-sm outline-none focus:border-cyan-300 transition-colors duration-300 [&>option]:bg-black dark:[&>option]:bg-black [&>option]:text-cyan-100"
                style={{ background: "var(--input-bg)", color: "var(--input-text)" }}
              >
                {chapters.map((c, idx) => (
                  <option key={`chapter-${c}-${idx}`} value={c}>
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
                className="cursor-pointer h-9 rounded-md border border-cyan-400/40 px-3 text-sm transition-all duration-200 hover:border-cyan-300/60 active:scale-95"
                style={{ color: "var(--text-primary)" }}
              >
                Export CSV
              </button>
            </div>

            <div className="max-h-[50vh] overflow-auto rounded-lg border border-cyan-400/15 p-3 transition-colors duration-300" style={{ background: "var(--input-bg)" }}>
              <ul className="space-y-2 text-sm">
                {engagement
                  .filter((e) => (chapterFilter === "all" ? true : (e.member.chapter ?? "") === chapterFilter))
                  .slice(0, 100)
                  .map((e, idx) => (
                    <li key={`member-engagement-${e.member.id}-${e.count}-${idx}`} className="flex items-center justify-between rounded-md border border-cyan-400/10 px-3 py-2 transition-colors duration-300" style={{ background: "var(--card-bg)" }}>
                      <div className="min-w-0">
                        <div className="truncate text-cyan-400">{e.member.name}</div>
                        <div className="text-[10px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{e.member.id}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-[12px] text-cyan-300">{e.member.chapter ?? "—"}</div>
                        <div className="min-w-[60px] rounded-md bg-cyan-400/10 px-2 py-1 text-center text-[12px] font-medium text-cyan-600 dark:text-cyan-200">
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
