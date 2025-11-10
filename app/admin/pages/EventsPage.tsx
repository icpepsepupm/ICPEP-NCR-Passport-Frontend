"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Search, Plus, X, Edit2, Trash2, Calendar, MapPin, FileText, AlertCircle, Clock, Users } from "lucide-react";

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  description: string;
  attendees?: number;
}

// Mock auth function for demo
const getCurrentUser = async () => ({ id: 1, username: "admin", role: "ADMIN" });

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Event>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>("all");

  const API_BASE = "http://localhost:8080/api/events";

  useEffect(() => {
    setMounted(true);
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      setError("You must be logged in to view events.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("icpep-auth-token");
      const res = await fetch(API_BASE, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (res.status === 401) throw new Error("Unauthorized. Please log in again.");
      if (res.status === 403) throw new Error("Forbidden.");
      if (!res.ok) throw new Error("Failed to fetch events.");

      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      // Demo data for visualization
      setEvents([
        { id: 1, name: "Tech Summit 2025", date: "2025-01-15", location: "Manila Convention Center", description: "Annual technology conference featuring the latest innovations in computer engineering.", attendees: 250 },
        { id: 2, name: "Workshop: AI & Machine Learning", date: "2025-02-20", location: "ICpEP Training Room", description: "Hands-on workshop covering fundamentals of AI and ML for engineers.", attendees: 50 },
        { id: 3, name: "Networking Night", date: "2025-03-10", location: "Quezon City Hall", description: "Professional networking event for ICpEP members and industry partners.", attendees: 120 },
        { id: 4, name: "Hackathon 2025", date: "2025-04-05", location: "University of the Philippines", description: "24-hour coding competition with amazing prizes and mentorship opportunities.", attendees: 80 },
        { id: 5, name: "Career Fair", date: "2025-05-15", location: "World Trade Center", description: "Connect with top tech companies and explore career opportunities.", attendees: 300 },
        { id: 6, name: "IoT Workshop", date: "2025-06-22", location: "Makati Innovation Hub", description: "Learn about Internet of Things devices and smart systems development.", attendees: 45 },
      ]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.date || !form.location) {
      alert("Please fill in name, date, and location");
      return;
    }

    try {
      const token = localStorage.getItem("icpep-auth-token");
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save event.");

      setForm({});
      setEditingId(null);
      setShowForm(false);
      fetchEvents();
    } catch (err: any) {
      alert(err.message || "Unknown error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      const token = localStorage.getItem("icpep-auth-token");
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (!res.ok) throw new Error("Failed to delete event.");
      fetchEvents();
    } catch (err: any) {
      alert(err.message || "Unknown error");
    }
  };

  const handleEdit = (event: Event) => {
    setForm(event);
    setEditingId(event.id);
    setShowForm(true);
  };

  const filteredEvents = useMemo(() => {
    let filtered = events;

    const q = query.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q)
      );
    }

    const today = new Date().toISOString().split('T')[0];
    if (dateFilter === "upcoming") {
      filtered = filtered.filter((e) => e.date >= today);
    } else if (dateFilter === "past") {
      filtered = filtered.filter((e) => e.date < today);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events, query, dateFilter]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: events.length,
      upcoming: events.filter(e => e.date >= today).length,
      past: events.filter(e => e.date < today).length,
      totalAttendees: events.reduce((sum, e) => sum + (e.attendees || 0), 0),
    };
  }, [events]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isUpcoming = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString >= today;
  };

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
        {/* Header Card */}
        <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm animate-fade-in transition-all duration-300 mb-6" style={{ background: "var(--card-bg)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="orbitron text-2xl text-cyan-400 font-bold">Events Dashboard</h2>
              <p className="text-[11px] mt-1 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                Manage organization events and activities
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("icpep-user");
                window.location.href = "/auth/login";
              }}
              className="h-8 px-3 text-[11px] rounded-md border border-cyan-400/40 hover:border-cyan-300/60 hover:scale-105 active:scale-95 transition-all duration-200"
              style={{ color: "var(--text-secondary)" }}
            >
              Log out
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)", animationDelay: "0s" }}>
            <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Total Events</div>
            <div className="mt-2 text-2xl text-cyan-300 font-bold">{stats.total}</div>
          </div>
          
          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)", animationDelay: "0.05s" }}>
            <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Upcoming</div>
            <div className="mt-2 text-2xl text-emerald-400 font-bold">{stats.upcoming}</div>
          </div>

          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)", animationDelay: "0.1s" }}>
            <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Past Events</div>
            <div className="mt-2 text-2xl text-amber-400 font-bold">{stats.past}</div>
          </div>

          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)", animationDelay: "0.15s" }}>
            <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Total Attendees</div>
            <div className="mt-2 text-2xl text-purple-400 font-bold">{stats.totalAttendees}</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm mb-6 animate-fade-in" style={{ background: "var(--card-bg)" }}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/50" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events by name, location, or description..."
                className="w-full h-10 pl-10 pr-4 rounded-md border border-cyan-400/30 text-sm outline-none placeholder:text-cyan-200/50 focus:border-cyan-300 transition-all duration-300"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-10 px-3 rounded-md border border-cyan-400/30 text-sm font-medium outline-none focus:border-cyan-300 transition-all duration-300 cursor-pointer"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>

              <button
                onClick={() => {
                  setForm({});
                  setEditingId(null);
                  setShowForm(true);
                }}
                className="h-10 px-4 rounded-md bg-teal-500/90 text-black font-semibold text-sm transition-all duration-200 hover:bg-teal-400 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Event
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-950/20 p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-cyan-400/20 border-t-cyan-400 animate-spin"></div>
              <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-r-cyan-300 animate-spin" style={{ animationDuration: "1.5s", animationDirection: "reverse" }}></div>
            </div>
          </div>
        )}

        {/* Events Table */}
        <div className="rounded-xl border border-cyan-400/25 overflow-hidden neon-panel animate-fade-in" style={{ background: "var(--card-bg)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-400/20" style={{ background: "var(--input-bg)" }}>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Event</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Location</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Attendees</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filteredEvents.length === 0 && (
                  <tr key="no-events">
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-cyan-400/30" />
                      <p className="text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>No events found</p>
                      <p className="text-[11px] mt-1 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Try adjusting your search or filters</p>
                    </td>
                  </tr>
                )}
                {filteredEvents.map((event, idx) => (
                  <tr
                    key={event.id}
                    className="border-b border-cyan-400/10 hover:bg-cyan-400/5 transition-all duration-200 animate-slide-up"
                    style={{ animationDelay: `${idx * 0.03}s` }}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${isUpcoming(event.date) ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-slate-500 to-slate-600'} flex items-center justify-center shadow-md`}>
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="orbitron text-[13px] text-cyan-400 font-semibold">
                            {event.name}
                          </div>
                          {isUpcoming(event.date) && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                              <Clock className="w-3 h-3" />
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400/50" />
                        <span className="text-[12px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                          {formatDate(event.date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400/50" />
                        <span className="text-[12px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                          {event.location}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-2 max-w-md">
                        <FileText className="w-3.5 h-3.5 text-cyan-400/50 mt-0.5 flex-shrink-0" />
                        <span className="text-[12px] line-clamp-2 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                          {event.description || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-cyan-400/50" />
                        <span className="text-[12px] font-medium text-cyan-300">
                          {event.attendees || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-2 hover:bg-cyan-400/10 rounded-lg transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-cyan-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-2 hover:bg-red-400/10 rounded-lg transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="rounded-2xl border border-cyan-400/25 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto neon-panel" style={{ background: "var(--card-bg)" }}>
              <div className="sticky top-0 border-b border-cyan-400/20 p-6 flex items-center justify-between" style={{ background: "var(--card-bg)" }}>
                <h3 className="orbitron text-xl text-cyan-400 font-bold">
                  {editingId ? "Edit Event" : "Add New Event"}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setForm({});
                    setEditingId(null);
                  }}
                  className="p-2 hover:bg-cyan-400/10 rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-5 h-5 text-cyan-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium mb-2 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      Event Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name || ""}
                      onChange={handleChange}
                      placeholder="Tech Summit 2025"
                      className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all duration-300"
                      style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-2 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={form.date || ""}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all duration-300"
                      style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-2 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={form.location || ""}
                      onChange={handleChange}
                      placeholder="Manila Convention Center"
                      className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all duration-300"
                      style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium mb-2 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={form.description || ""}
                      onChange={handleChange}
                      placeholder="Describe the event, agenda, speakers, and other details..."
                      rows={4}
                      className="w-full px-3 py-2 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all duration-300 resize-none"
                      style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-2 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      Expected Attendees
                    </label>
                    <input
                      type="number"
                      name="attendees"
                      value={form.attendees || ""}
                      onChange={handleChange}
                      placeholder="100"
                      min="0"
                      className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all duration-300"
                      style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 h-10 rounded-md bg-teal-500/90 text-black font-semibold text-sm transition-all duration-200 hover:bg-teal-400 active:scale-95 cursor-pointer"
                  >
                    {editingId ? "Update Event" : "Create Event"}
                  </button>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setForm({});
                      setEditingId(null);
                    }}
                    className="px-6 h-10 rounded-md border border-cyan-400/40 text-sm transition-all duration-200 hover:border-cyan-300/60 active:scale-95 cursor-pointer"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}