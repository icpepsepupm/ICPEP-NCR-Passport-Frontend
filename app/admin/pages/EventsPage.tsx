"use client";

import React, { useMemo, useState } from "react";
import { Search, Plus, X, Edit2, Trash2, Calendar, MapPin, FileText, AlertCircle, Clock, Users, RefreshCw } from "lucide-react";
import { useEvents } from "@/lib/hooks/useEvents";
import type { ClientEvent } from "@/lib/api/mappers";
import { getErrorMessage } from "@/lib/api/errors";
import { clearCurrentUser } from "@/app/lib/client-auth";

export default function EventsPage() {
  const [form, setForm] = useState<Partial<ClientEvent>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "upcoming" | "past">("all");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { events, loading, error, refetch, createEvent, updateEvent, deleteEvent } = useEvents(
    dateFilter,
    { search: query }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "attendees" ? Number(value) : value,
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.date || !form.location) {
      setActionError("Please fill in name, date, and location.");
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      if (editingId) {
        await updateEvent(editingId, form);
      } else {
        await createEvent(form);
      }
      setForm({});
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    setActionError(null);
    try {
      await deleteEvent(id);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleEdit = (event: ClientEvent) => {
    setForm(event);
    setEditingId(event.id);
    setShowForm(true);
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      total: events.length,
      upcoming: events.filter((e) => e.date >= today).length,
      past: events.filter((e) => e.date < today).length,
      totalAttendees: events.reduce((sum, e) => sum + (e.attendees || 0), 0),
    };
  }, [events]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const isUpcoming = (dateString: string) => {
    const today = new Date().toISOString().split("T")[0];
    return dateString >= today;
  };

  return (
    <div className="relative min-h-dvh isolate overflow-hidden transition-colors duration-300" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.25), transparent 70%)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.18), transparent 70%)" }} />

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm mb-6" style={{ background: "var(--card-bg)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="orbitron text-2xl text-cyan-400 font-bold">Events Dashboard</h2>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>Manage organization events and activities</p>
            </div>
            <button
              onClick={() => { clearCurrentUser(); window.location.href = "/auth/login"; }}
              className="h-8 px-3 text-[11px] rounded-md border border-cyan-400/40 hover:border-cyan-300/60 transition-all"
              style={{ color: "var(--text-secondary)" }}
            >
              Log out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Events", value: stats.total, color: "text-cyan-300" },
            { label: "Upcoming", value: stats.upcoming, color: "text-emerald-400" },
            { label: "Past Events", value: stats.past, color: "text-amber-400" },
            { label: "Total Attendees", value: stats.totalAttendees, color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-cyan-400/25 p-4 neon-panel" style={{ background: "var(--card-bg)" }}>
              <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
              <div className={`mt-2 text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm mb-6" style={{ background: "var(--card-bg)" }}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/50" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events by name, location, or description..."
                className="w-full h-10 pl-10 pr-4 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
              />
            </div>
            <div className="flex gap-3">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as "all" | "upcoming" | "past")}
                className="h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 cursor-pointer"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
              <button
                onClick={() => { setForm({}); setEditingId(null); setShowForm(true); }}
                className="h-10 px-4 rounded-md bg-teal-500/90 text-black font-semibold text-sm hover:bg-teal-400 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Event
              </button>
            </div>
          </div>
        </div>

        {(error || actionError) && (
          <div className="rounded-xl border border-red-400/30 bg-red-950/20 p-4 mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-300">{error || actionError}</p>
            </div>
            <button onClick={() => void refetch()} className="flex items-center gap-1 text-xs text-red-200 hover:text-red-100">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        <div className="rounded-xl border border-cyan-400/25 overflow-hidden neon-panel" style={{ background: "var(--card-bg)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-400/20" style={{ background: "var(--input-bg)" }}>
                  {["Event", "Date", "Location", "Description", "Attendees", "Actions"].map((h) => (
                    <th key={h} className={`px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skel-${i}`} className="border-b border-cyan-400/10">
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-4 bg-cyan-400/10 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-cyan-400/30" />
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No events found</p>
                      <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
                        {query || dateFilter !== "all" ? "Try adjusting your search or filters" : "Create your first event to get started"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="border-b border-cyan-400/10 hover:bg-cyan-400/5">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${isUpcoming(event.date) ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-slate-500 to-slate-600"} flex items-center justify-center`}>
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="orbitron text-[13px] text-cyan-400 font-semibold">{event.name}</div>
                            {isUpcoming(event.date) && (
                              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                                <Clock className="w-3 h-3" /> Upcoming
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[12px]" style={{ color: "var(--text-secondary)" }}>{formatDate(event.date)}</td>
                      <td className="px-4 py-4 text-[12px]" style={{ color: "var(--text-secondary)" }}>{event.location || "—"}</td>
                      <td className="px-4 py-4 text-[12px] line-clamp-2 max-w-md" style={{ color: "var(--text-secondary)" }}>{event.description || "—"}</td>
                      <td className="px-4 py-4"><span className="text-[12px] font-medium text-cyan-300 flex items-center gap-1"><Users className="w-3.5 h-3.5" />{event.attendees}</span></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(event)} className="p-2 hover:bg-cyan-400/10 rounded-lg cursor-pointer" title="Edit"><Edit2 className="w-4 h-4 text-cyan-400" /></button>
                          <button onClick={() => handleDelete(event.id)} className="p-2 hover:bg-red-400/10 rounded-lg cursor-pointer" title="Delete"><Trash2 className="w-4 h-4 text-red-400" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="rounded-2xl border border-cyan-400/25 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto neon-panel" style={{ background: "var(--card-bg)" }}>
              <div className="sticky top-0 border-b border-cyan-400/20 p-6 flex items-center justify-between" style={{ background: "var(--card-bg)" }}>
                <h3 className="orbitron text-xl text-cyan-400 font-bold">{editingId ? "Edit Event" : "Add New Event"}</h3>
                <button onClick={() => { setShowForm(false); setForm({}); setEditingId(null); }} className="p-2 hover:bg-cyan-400/10 rounded-lg cursor-pointer"><X className="w-5 h-5 text-cyan-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Event Name *</label>
                    <input type="text" name="name" value={form.name || ""} onChange={handleChange} className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300" style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }} required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Date *</label>
                    <input type="date" name="date" value={form.date || ""} onChange={handleChange} className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300" style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }} required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Location *</label>
                    <input type="text" name="location" value={form.location || ""} onChange={handleChange} className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300" style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Description</label>
                    <textarea name="description" value={form.description || ""} onChange={handleChange} rows={4} className="w-full px-3 py-2 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 resize-none" style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }} />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={handleSubmit} disabled={submitting} className="flex-1 h-10 rounded-md bg-teal-500/90 text-black font-semibold text-sm hover:bg-teal-400 disabled:opacity-60 cursor-pointer">
                    {submitting ? "Saving…" : editingId ? "Update Event" : "Create Event"}
                  </button>
                  <button onClick={() => { setShowForm(false); setForm({}); setEditingId(null); }} className="px-6 h-10 rounded-md border border-cyan-400/40 text-sm cursor-pointer" style={{ color: "var(--text-primary)" }}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
