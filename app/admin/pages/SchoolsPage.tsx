"use client";

import React, { useMemo, useState } from "react";
import { Search, Plus, Trash2, Pencil, Building, AlertCircle, RefreshCw } from "lucide-react";
import AddSchoolModal from "@/app/admin/components/AddSchoolModal";
import EditSchoolModal from "@/app/admin/components/EditSchoolModal";
import { useSchools, School } from "@/lib/hooks/useSchools";

export default function SchoolsPage() {
  const [query, setQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { schools, loading, error, refetch, createSchool, updateSchool, deleteSchool } = useSchools();

  const filteredSchools = useMemo(() => {
    if (!query) return schools;
    const lowerQuery = query.toLowerCase();
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.code.toLowerCase().includes(lowerQuery)
    );
  }, [schools, query]);

  const handleAddSubmit = async (data: { name: string; code: string }) => {
    setActionError(null);
    try {
      await createSchool(data);
      setShowAddModal(false);
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || "Failed to create school.");
    }
  };

  const handleEditSubmit = async (id: number, data: { name: string; code: string }) => {
    setActionError(null);
    try {
      await updateSchool(id, data);
      setEditingSchool(null);
    } catch (err: any) {
      setActionError(err.message || "Failed to update school.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this school? It might affect assigned members.")) return;
    setActionError(null);
    try {
      await deleteSchool(id);
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || "Failed to delete school.");
    }
  };

  return (
    <div className="relative min-h-dvh isolate overflow-hidden transition-colors duration-300" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.25), transparent 70%)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.18), transparent 70%)" }} />

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm mb-6" style={{ background: "var(--card-bg)" }}>
          <h2 className="orbitron text-2xl text-cyan-400 font-bold">Schools Dashboard</h2>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>Manage registered schools and organizations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-cyan-400/25 p-4 neon-panel" style={{ background: "var(--card-bg)" }}>
            <div className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Total Schools</div>
            <div className="mt-2 text-2xl font-bold text-cyan-300">{schools.length}</div>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm mb-6" style={{ background: "var(--card-bg)" }}>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/50" />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search schools..." className="w-full h-10 pl-10 pr-4 rounded-md border border-cyan-400/30 text-sm outline-none focus:border-cyan-300" style={{ backgroundColor: "var(--input-bg)", color: "var(--input-text)" }} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(true)} className="h-10 px-4 rounded-md bg-teal-500/90 text-black font-semibold text-sm hover:bg-teal-400 flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" /> Add School
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
                  {["School Name", "Code", "Actions"].map((h) => <th key={h} className={`px-4 py-3 text-[11px] font-semibold text-cyan-400 uppercase ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({ length: 3 }).map((_, i) => <tr key={`skel-${i}`} className="border-b border-cyan-400/10"><td className="px-4 py-4" colSpan={3}><div className="h-4 bg-cyan-400/10 rounded animate-pulse" /></td></tr>) : filteredSchools.length === 0 ? <tr><td colSpan={3} className="px-4 py-12 text-center"><Building className="w-12 h-12 mx-auto mb-3 text-cyan-400/30" /><p className="text-sm" style={{ color: "var(--text-secondary)" }}>No schools found</p></td></tr> : filteredSchools.map((school) => (
                    <tr key={school.id} className="border-b border-cyan-400/10 hover:bg-cyan-400/5">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center text-white font-bold text-sm`}>{school.name.charAt(0)}</div><div><div className="orbitron text-[13px] text-cyan-400 font-semibold">{school.name}</div></div></div>
                      </td>
                      <td className="px-4 py-4"><span className="text-[12px] font-mono" style={{ color: "var(--text-secondary)" }}>{school.code}</span></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingSchool(school)} className="p-2 hover:bg-cyan-400/10 rounded-lg cursor-pointer"><Pencil className="w-4 h-4 text-cyan-400" /></button>
                          <button onClick={() => handleDelete(school.id)} className="p-2 hover:bg-red-400/10 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4 text-red-400" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        {showAddModal && <AddSchoolModal onClose={() => setShowAddModal(false)} onSubmit={handleAddSubmit} />}
        {editingSchool && <EditSchoolModal school={editingSchool} onClose={() => setEditingSchool(null)} onSubmit={handleEditSubmit} />}
      </div>
    </div>
  );
}