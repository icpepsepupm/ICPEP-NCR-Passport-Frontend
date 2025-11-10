"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Search, UserPlus, X, Edit2, Trash2, Mail, Phone, User, Shield, Crown, AlertCircle } from "lucide-react";
import { getAuthToken } from "@/app/lib/client-auth";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  age?: number;
  role: string;
  email?: string;
  phone?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  schoolId?: number;
  memberId?: string;
  password?: string;
}

const getCurrentUser = async () => {
  const token = getAuthToken();
  return token ? { id: 1, username: "admin", role: "ADMIN" } : null;
};

export default function MembersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<User>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schools, setSchools] = useState<any[]>([]);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/users`
    : "http://localhost:8080/api/users";

  useEffect(() => {
    setMounted(true);
    fetchUsers();
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch("http://localhost:8080/api/schools", {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error("Failed to load schools");

      const data = await res.json();
      setSchools(data);
    } catch (err) {
      console.error("School load error:", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      setError("You must be logged in to view users.");
      setLoading(false);
      return;
    }

    try {
      const token = getAuthToken();
      const res = await fetch(API_BASE, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (res.status === 401) throw new Error("Unauthorized. Please log in again.");
      if (res.status === 403) throw new Error("Forbidden. You don't have permission to view users.");
      if (!res.ok) throw new Error("Failed to fetch users.");

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Unknown error occurred");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.role || !form.schoolId) {
      alert("First name, last name, role, and school ID are required.");
      return;
    }

    // For new users, password is required
    if (!editingId && !form.password) {
      alert("Password is required for new users.");
      return;
    }

    try {
      const token = getAuthToken();
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;

      const payload: any = {
        firstName: form.firstName,
        lastName: form.lastName,
        age: form.age,
        role: form.role,
        schoolId: form.schoolId,
      };

      // Only include password if provided
      if (form.password) {
        payload.password = form.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save user.");
      }

      setForm({});
      setEditingId(null);
      setShowForm(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Unknown error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete user.");
      }
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Unknown error");
    }
  };

  const handleEdit = (user: User) => {
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      role: user.role,
      schoolId: user.schoolId,
      // Don't include password in edit form
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const filteredUsers = useMemo(() => {
    let filtered = users;

    const q = query.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((u) => u.status === statusFilter);
    }

    return filtered;
  }, [users, query, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      approved: users.filter(u => u.status === "APPROVED").length,
      pending: users.filter(u => u.status === "PENDING").length,
      admins: users.filter(u => u.role === "ADMIN").length,
      officers: users.filter(u => u.role === "SCANNER").length,
      members: users.filter(u => u.role === "MEMBER").length,
    };
  }, [users]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Crown className="w-4 h-4" />;
      case "SCANNER":
        return <Shield className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "from-purple-500 to-purple-700";
      case "SCANNER":
        return "from-blue-500 to-blue-700";
      default:
        return "from-cyan-500 to-cyan-700";
    }
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
              <h2 className="orbitron text-2xl text-cyan-400 font-bold">Members Dashboard</h2>
              <p className="text-[11px] mt-1 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                Manage organization members and roles
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)", animationDelay: "0s" }}>
            <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Total</div>
            <div className="mt-2 text-2xl text-cyan-300 font-bold">{stats.total}</div>
          </div>

          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)", animationDelay: "0.05s" }}>
            <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Approved</div>
            <div className="mt-2 text-2xl text-emerald-400 font-bold">{stats.approved}</div>
          </div>

          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)", animationDelay: "0.1s" }}>
            <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Pending</div>
            <div className="mt-2 text-2xl text-amber-400 font-bold">{stats.pending}</div>
          </div>

          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)", animationDelay: "0.15s" }}>
            <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Admins</div>
            <div className="mt-2 text-2xl text-purple-400 font-bold">{stats.admins}</div>
          </div>

          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)", animationDelay: "0.2s" }}>
            <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Scanners</div>
            <div className="mt-2 text-2xl text-blue-400 font-bold">{stats.officers}</div>
          </div>

          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)", animationDelay: "0.25s" }}>
            <div className="text-[11px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Members</div>
            <div className="mt-2 text-2xl text-cyan-400 font-bold">{stats.members}</div>
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
                placeholder="Search members by name, username, or email..."
                className="w-full h-10 pl-10 pr-4 rounded-md border border-cyan-400/30 text-sm outline-none placeholder:text-cyan-200/50 focus:border-cyan-300 transition-all duration-300"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 px-3 rounded-md border border-cyan-400/30 text-sm font-medium outline-none focus:border-cyan-300 transition-all duration-300 cursor-pointer"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="SCANNER">Scanner</option>
                <option value="MEMBER">Member</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-md border border-cyan-400/30 text-sm font-medium outline-none focus:border-cyan-300 transition-all duration-300 cursor-pointer"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
              >
                <option value="all">All Status</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <button
                onClick={() => {
                  setForm({});
                  setEditingId(null);
                  setShowForm(true);
                }}
                className="h-10 px-4 rounded-md bg-teal-500/90 text-black font-semibold text-sm transition-all duration-200 hover:bg-teal-400 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
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

        {/* Members Table */}
        <div className="rounded-xl border border-cyan-400/25 overflow-hidden neon-panel animate-fade-in" style={{ background: "var(--card-bg)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-400/20" style={{ background: "var(--input-bg)" }}>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Member</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Username</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Age</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <User className="w-12 h-12 mx-auto mb-3 text-cyan-400/30" />
                      <p className="text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>No members found</p>
                      <p className="text-[11px] mt-1 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                        {error ? "Failed to load members from the server" : "Try adjusting your search or filters"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <tr
                      key={user.id}
                      className="border-b border-cyan-400/10 hover:bg-cyan-400/5 transition-all duration-200 animate-slide-up"
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div>
                            <div className="orbitron text-[13px] text-cyan-400 font-semibold">
                              {user.firstName} {user.lastName}
                            </div>
                            {user.memberId && (
                              <div className="text-[10px] text-cyan-400/50">{user.memberId}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[12px] font-mono transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                          {user.username}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[12px] transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                          {user.age || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${user.role === "ADMIN"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                            : user.role === "SCANNER"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                              : "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                            }`}
                        >
                          {getRoleIcon(user.role)}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${user.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                            : user.status === "REJECTED"
                              ? "bg-red-500/20 text-red-300 border border-red-400/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                            }`}
                        >
                          {user.status || "PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 hover:bg-cyan-400/10 rounded-lg transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-cyan-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 hover:bg-red-400/10 rounded-lg transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
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
                  {editingId ? "Edit Member" : "Add New Member"}
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
                <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3 mb-4">
                  <p className="text-[11px] text-cyan-300/80">
                    <strong>Note:</strong> Username is auto-generated based on role and school code (e.g., NCR-MB-SCHOOL-01).
                    {editingId && " Password is optional when editing - leave blank to keep current password."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium mb-2 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName || ""}
                      onChange={handleChange}
                      placeholder="John"
                      className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all duration-300"
                      style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-2 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName || ""}
                      onChange={handleChange}
                      placeholder="Doe"
                      className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all duration-300"
                      style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-2 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={form.age || ""}
                      onChange={handleChange}
                      placeholder="25"
                      min="1"
                      max="120"
                      className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all duration-300"
                      style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-2 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      Role *
                    </label>
                    <select
                      name="role"
                      value={form.role || ""}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all duration-300 cursor-pointer"
                      style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
                      required
                    >
                      <option value="">Select role</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SCANNER">Scanner</option>
                      <option value="MEMBER">Member</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium mb-2 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      School ID *
                    </label>
                    <select
                      name="schoolId"
                      value={form.schoolId || ""}
                      onChange={handleChange}
                      className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all duration-300 cursor-pointer"
                      style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
                      required
                    >
                      <option value="">Select School</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))}
                    </select>


                    <div>
                      <label className="block text-[11px] font-medium mb-2 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                        Password {!editingId && "*"}
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={form.password || ""}
                        onChange={handleChange}
                        placeholder={editingId ? "Leave blank to keep current" : "Enter password"}
                        className="w-full h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 transition-all duration-300"
                        style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
                        required={!editingId}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSubmit}
                      className="flex-1 h-10 rounded-md bg-teal-500/90 text-black font-semibold text-sm transition-all duration-200 hover:bg-teal-400 active:scale-95 cursor-pointer"
                    >
                      {editingId ? "Update Member" : "Create Member"}
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
          </div>
        )}
      </div>
    </div>
  );
}