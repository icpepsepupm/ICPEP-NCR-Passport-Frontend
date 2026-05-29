"use client";

import React, { useMemo, useState } from "react";
import { Search, UserPlus, Edit2, Trash2, User as UserIcon, Shield, Crown, AlertCircle, FileText, RefreshCw } from "lucide-react";
import AddMemberModal from "@/app/admin/components/AddMemberModal";
import EditMemberModal from "@/app/admin/components/EditMemberModal";
import CSVImportModal from "@/app/admin/components/CSVImportModal";
import { useUsers } from "@/lib/hooks/useUsers";
import type { ClientUser } from "@/lib/api/mappers";
import { getErrorMessage } from "@/lib/api/errors";

export default function MembersPage() {
  const [editingUser, setEditingUser] = useState<ClientUser | null>(null);
  const [query, setQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionError, setActionError] = useState<string | null>(null);

  const { users, schools, loading, error, refetch, createUser, updateUser, deleteUser } = useUsers({
    search: query,
    role: roleFilter !== "all" ? roleFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const handleAddSubmit = async (data: Partial<ClientUser> & { password?: string; certificateUrl?: string }) => {
    setActionError(null);
    try {
      await createUser({
        ...data,
        ecertificateUrl: data.certificateUrl ?? data.ecertificateUrl,
      });
      setShowAddModal(false);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleEditSubmit = async (data: Partial<ClientUser> & { password?: string }) => {
    if (!editingUser) return;
    setActionError(null);
    try {
      await updateUser(editingUser.id, data);
      setEditingUser(null);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setActionError(null);
    try {
      await deleteUser(id);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  };

  const stats = useMemo(() => ({
    total: users.length,
    approved: users.filter((u) => u.status === "APPROVED").length,
    pending: users.filter((u) => u.status === "PENDING").length,
    admins: users.filter((u) => u.role === "ADMIN").length,
    officers: users.filter((u) => u.role === "SCANNER").length,
    members: users.filter((u) => u.role === "MEMBER").length,
  }), [users]);

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

  return (
    <div className="relative min-h-dvh isolate overflow-hidden transition-colors duration-300" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.25), transparent 70%)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.18), transparent 70%)" }} />

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm mb-6" style={{ background: "var(--card-bg)" }}>
          <h2 className="orbitron text-2xl text-cyan-400 font-bold">Members Dashboard</h2>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>Manage organization members and roles</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-cyan-300" },
            { label: "Approved", value: stats.approved, color: "text-emerald-400" },
            { label: "Pending", value: stats.pending, color: "text-amber-400" },
            { label: "Admins", value: stats.admins, color: "text-purple-400" },
            { label: "Scanners", value: stats.officers, color: "text-blue-400" },
            { label: "Members", value: stats.members, color: "text-cyan-400" },
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
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members..." className="w-full h-10 pl-10 pr-4 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300" style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }} />
            </div>
            <div className="flex gap-3">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 px-3 rounded-md border border-cyan-400/30 text-sm cursor-pointer" style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}>
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="SCANNER">Scanner</option>
                <option value="MEMBER">Member</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-10 px-3 rounded-md border border-cyan-400/30 text-sm cursor-pointer" style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }}>
                <option value="all">All Status</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING">Pending</option>
              </select>
              <button onClick={() => setShowAddModal(true)} className="h-10 px-4 rounded-md bg-teal-500/90 text-black font-semibold text-sm hover:bg-teal-400 flex items-center gap-2 cursor-pointer">
                <UserPlus className="w-4 h-4" /> Add Member
              </button>
            </div>
          </div>
        </div>

        {(error || actionError) && (
          <div className="rounded-xl border border-red-400/30 bg-red-950/20 p-4 mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-300">{error || actionError}</p>
            </div>
            <button onClick={() => void refetch()} className="flex items-center gap-1 text-xs text-red-200"><RefreshCw className="w-3.5 h-3.5" /> Retry</button>
          </div>
        )}

        <div className="rounded-xl border border-cyan-400/25 overflow-hidden neon-panel" style={{ background: "var(--card-bg)" }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-400/20" style={{ background: "var(--input-bg)" }}>
                  {["Member", "Username", "Role", "Status", "Certificate", "Actions"].map((h) => (
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
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <UserIcon className="w-12 h-12 mx-auto mb-3 text-cyan-400/30" />
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No members found</p>
                      <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>Add a member or adjust your filters</p>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-cyan-400/10 hover:bg-cyan-400/5">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white font-bold text-sm`}>
                            {(user.firstName?.[0] ?? "")}{(user.lastName?.[0] ?? "")}
                          </div>
                          <div>
                            <div className="orbitron text-[13px] text-cyan-400 font-semibold">{user.firstName} {user.lastName}</div>
                            {user.memberId && <div className="text-[10px] text-cyan-400/50">{user.memberId}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4"><span className="text-[12px] font-mono" style={{ color: "var(--text-secondary)" }}>{user.username}</span></td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${user.role === "ADMIN" ? "bg-purple-500/20 text-purple-300 border border-purple-400/30" : user.role === "SCANNER" ? "bg-blue-500/20 text-blue-300 border border-blue-400/30" : "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"}`}>
                          {getRoleIcon(user.role)} {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${user.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" : "bg-amber-500/20 text-amber-300 border border-amber-400/30"}`}>{user.status}</span>
                      </td>
                      <td className="px-4 py-4">
                        {user.ecertificateUrl ? (
                          <a href={user.ecertificateUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] text-cyan-300 hover:text-cyan-200"><FileText className="w-3.5 h-3.5" /> View</a>
                        ) : <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>—</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingUser(user)} className="p-2 hover:bg-cyan-400/10 rounded-lg cursor-pointer"><Edit2 className="w-4 h-4 text-cyan-400" /></button>
                          <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-red-400/10 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4 text-red-400" /></button>
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
        {editingUser && <EditMemberModal user={{ ...editingUser, firstName: editingUser.firstName ?? "", lastName: editingUser.lastName ?? "" }} onClose={() => setEditingUser(null)} onSubmit={(data) => handleEditSubmit({ ...data, ecertificateUrl: data.certificateUrl })} schools={schools} />}
        {showImportModal && <CSVImportModal onClose={() => setShowImportModal(false)} onSuccess={() => { refetch(); }} />}
      </div>
    </div>
  );
}
