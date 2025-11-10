"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Search, UserPlus, Edit2, Trash2, User as UserIcon, Shield, Crown, AlertCircle } from "lucide-react";
import { getAuthToken } from "@/app/lib/client-auth";
import AddMemberModal from "@/app/admin/components/AddMemberModal";
import EditMemberModal from "@/app/admin/components/EditMemberModal";

// ✅ Renamed to avoid conflict with Lucide's User icon
interface MemberUser {
  id: number;          // This will now always be mapped
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

interface School {
  id: number;
  name: string;
  code: string;
}

const getCurrentUser = async () => {
  const token = getAuthToken();
  return token ? { id: 1, username: "admin", role: "ADMIN" } : null;
};

export default function MembersPage() {
  const [users, setUsers] = useState<MemberUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<MemberUser | null>(null);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [schools, setSchools] = useState<School[]>([]);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/users`
    : "http://localhost:8080/api/users";

  const SCHOOLS_API = process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/schools`
    : "http://localhost:8080/api/schools";

  useEffect(() => {
    setMounted(true);
    fetchUsers();
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(SCHOOLS_API, {
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

      // ✅ Map _id to id if backend uses _id
      const mappedUsers: MemberUser[] = Array.isArray(data)
        ? data.map((u: any) => {
          const mappedUser = {
            ...u,
            id: u.id || u._id || u.userId, // Try multiple possible ID fields
          };

          if (!mappedUser.id) {
            console.error('User missing ID:', u);
          }

          return mappedUser;
        })
        : [];

      console.log("Fetched users:", mappedUsers);
      setUsers(mappedUsers);
    } catch (err: any) {
      setError(err.message || "Unknown error occurred");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (data: Partial<MemberUser>) => {
    try {
      const token = getAuthToken();
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create user.");
      }

      setShowAddModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Unknown error");
    }
  };

  const handleEditSubmit = async (data: Partial<MemberUser>) => {
    if (!editingUser) return;

    console.log("Editing user:", editingUser);
    console.log("User ID:", editingUser.id);

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update user.");
      }

      setEditingUser(null);
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
      case "ADMIN": return <Crown className="w-4 h-4" />;
      case "SCANNER": return <Shield className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "from-purple-500 to-purple-700";
      case "SCANNER": return "from-blue-500 to-blue-700";
      default: return "from-cyan-500 to-cyan-700";
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-dvh isolate overflow-hidden transition-colors duration-300" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.25), transparent 70%)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.18), transparent 70%)" }} />

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm animate-fade-in mb-6" style={{ background: "var(--card-bg)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="orbitron text-2xl text-cyan-400 font-bold">Members Dashboard</h2>
              <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>Manage organization members and roles</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up" style={{ background: "var(--card-bg)", animationDelay: "0s" }}>
            <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Total</div>
            <div className="mt-2 text-2xl text-cyan-300 font-bold">{stats.total}</div>
          </div>
          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up" style={{ background: "var(--card-bg)", animationDelay: "0.05s" }}>
            <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Approved</div>
            <div className="mt-2 text-2xl text-emerald-400 font-bold">{stats.approved}</div>
          </div>
          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up" style={{ background: "var(--card-bg)", animationDelay: "0.1s" }}>
            <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Pending</div>
            <div className="mt-2 text-2xl text-amber-400 font-bold">{stats.pending}</div>
          </div>
          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up" style={{ background: "var(--card-bg)", animationDelay: "0.15s" }}>
            <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Admins</div>
            <div className="mt-2 text-2xl text-purple-400 font-bold">{stats.admins}</div>
          </div>
          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up" style={{ background: "var(--card-bg)", animationDelay: "0.2s" }}>
            <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Scanners</div>
            <div className="mt-2 text-2xl text-blue-400 font-bold">{stats.officers}</div>
          </div>
          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel animate-slide-up" style={{ background: "var(--card-bg)", animationDelay: "0.25s" }}>
            <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Members</div>
            <div className="mt-2 text-2xl text-cyan-400 font-bold">{stats.members}</div>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm mb-6 animate-fade-in" style={{ background: "var(--card-bg)" }}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/50" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search members..."
                className="w-full h-10 pl-10 pr-4 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300"
                style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}
              />
            </div>
            <div className="flex gap-3">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 cursor-pointer" style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}>
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="SCANNER">Scanner</option>
                <option value="MEMBER">Member</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300 cursor-pointer" style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}>
                <option value="all">All Status</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <button onClick={() => setShowAddModal(true)} className="h-10 px-4 rounded-md bg-teal-500/90 text-black font-semibold text-sm hover:bg-teal-400 active:scale-95 flex items-center gap-2 cursor-pointer">
                <UserPlus className="w-4 h-4" />
                Add Member
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-950/20 p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full border-4 border-cyan-400/20 border-t-cyan-400 animate-spin"></div>
          </div>
        )}

        <div className="rounded-xl border border-cyan-400/25 overflow-hidden neon-panel animate-fade-in" style={{ background: "var(--card-bg)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-400/20" style={{ background: "var(--input-bg)" }}>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase">Member</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase">Username</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase">Age</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase">Status</th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <UserIcon className="w-12 h-12 mx-auto mb-3 text-cyan-400/30" />
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No members found</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, idx) => (
                    <tr key={user.id} className="border-b border-cyan-400/10 hover:bg-cyan-400/5 animate-slide-up" style={{ animationDelay: `${idx * 0.03}s` }}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div>
                            <div className="orbitron text-[13px] text-cyan-400 font-semibold">{user.firstName} {user.lastName}</div>
                            {user.memberId && <div className="text-[10px] text-cyan-400/50">{user.memberId}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><span className="text-[12px] font-mono" style={{ color: "var(--text-secondary)" }}>{user.username}</span></td>
                      <td className="px-4 py-4"><span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{user.age || "—"}</span></td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${user.role === "ADMIN" ? "bg-purple-500/20 text-purple-300 border border-purple-400/30" :
                            user.role === "SCANNER" ? "bg-blue-500/20 text-blue-300 border border-blue-400/30" :
                              "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                          }`}>
                          {getRoleIcon(user.role)}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${user.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" :
                            user.status === "REJECTED" ? "bg-red-500/20 text-red-300 border border-red-400/30" :
                              "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                          }`}>
                          {user.status || "PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingUser(user)} className="p-2 hover:bg-cyan-400/10 rounded-lg cursor-pointer" title="Edit">
                            <Edit2 className="w-4 h-4 text-cyan-400" />
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-red-400/10 rounded-lg cursor-pointer" title="Delete">
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

        {showAddModal && <AddMemberModal onClose={() => setShowAddModal(false)} onSubmit={handleAddSubmit} schools={schools} />}
        {editingUser && <EditMemberModal user={editingUser} onClose={() => setEditingUser(null)} onSubmit={handleEditSubmit} schools={schools} />}
      </div>
    </div>
  );
}