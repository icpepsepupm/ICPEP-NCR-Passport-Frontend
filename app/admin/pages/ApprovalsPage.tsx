"use client";

import React, { useEffect, useState } from "react";
import { memberAPI, type Member } from "@/app/lib/api";

export function ApprovalsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending members using the API
  const fetchPendingMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await memberAPI.getPendingMembers();
      setMembers(data);
    } catch (err: any) {
      console.error('Failed to fetch pending members:', err);
      setError(err.message || 'Failed to load pending members');
    } finally {
      setLoading(false);
    }
  };

  // Approve member
  const handleApprove = async (id: number) => {
    if (!confirm("Are you sure you want to approve this member?")) return;
    try {
      await memberAPI.approveMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to approve member');
    }
  };

  // Reject member
  const handleReject = async (id: number) => {
    if (!confirm("Are you sure you want to reject this member?")) return;
    try {
      await memberAPI.rejectMember(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to reject member');
    }
  };

  useEffect(() => {
    fetchPendingMembers();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-cyan-400/15 p-8 text-center backdrop-blur-sm" 
           style={{ background: "var(--card-bg)" }}>
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-r-transparent"></div>
        <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>Loading pending approvals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-400/15 p-6 backdrop-blur-sm" 
           style={{ background: "var(--card-bg)" }}>
        <p className="text-red-400">Error: {error}</p>
        <button
          onClick={fetchPendingMembers}
          className="mt-3 rounded-md border border-cyan-400/40 px-4 py-2 text-sm transition-all hover:border-cyan-300/60"
          style={{ color: "var(--text-primary)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-cyan-400/15 p-8 text-center backdrop-blur-sm" 
           style={{ background: "var(--card-bg)" }}>
        <p style={{ color: "var(--text-secondary)" }}>No pending approvals</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cyan-400/15 p-6 backdrop-blur-sm transition-all duration-300 animate-fade-in">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4">Pending Approvals</h2>
      
      <div className="overflow-hidden rounded-xl border border-cyan-400/15" 
           style={{ background: "var(--card-bg)" }}>
        <table className="w-full">
          <thead className="border-b border-cyan-400/15">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide" 
                  style={{ color: "var(--text-secondary)" }}>
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide" 
                  style={{ color: "var(--text-secondary)" }}>
                Member ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide" 
                  style={{ color: "var(--text-secondary)" }}>
                School
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide" 
                  style={{ color: "var(--text-secondary)" }}>
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide" 
                  style={{ color: "var(--text-secondary)" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-400/10">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-cyan-400/5 transition-colors">
                <td className="px-4 py-3 text-sm" style={{ color: "var(--text-primary)" }}>
                  {member.firstName} {member.lastName}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {member.memberId || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  {member.school?.name || 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-full bg-yellow-400/10 px-2 py-1 text-xs font-medium text-yellow-400">
                    {member.status || 'PENDING'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleApprove(member.id)}
                      className="rounded-md border border-green-400/40 bg-green-950/40 px-3 py-1 text-xs text-green-200 transition-all hover:bg-green-500/30 active:scale-95"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(member.id)}
                      className="rounded-md border border-red-400/40 bg-red-950/40 px-3 py-1 text-xs text-red-200 transition-all hover:bg-red-500/30 active:scale-95"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}