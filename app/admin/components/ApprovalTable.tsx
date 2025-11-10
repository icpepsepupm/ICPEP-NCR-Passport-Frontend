"use client";

import React from "react";

interface Approval {
  id: number;
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface ApprovalTableProps {
  approvals: Approval[];
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}

export function ApprovalTable({ approvals, onApprove, onReject }: ApprovalTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-cyan-400/15 backdrop-blur-sm p-4">
      <table className="min-w-full table-auto text-cyan-100">
        <thead className="text-left text-cyan-200/70 border-b border-cyan-400/20">
          <tr>
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {approvals.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-4 text-cyan-200/50">
                No approvals found.
              </td>
            </tr>
          ) : (
            approvals.map((item) => (
              <tr key={item.id} className="border-b border-cyan-400/10 hover:bg-cyan-500/10">
                <td className="px-4 py-2">{item.id}</td>
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">{item.status}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => onApprove(item.id)}
                    className="bg-green-500/30 hover:bg-green-500/50 px-3 py-1 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(item.id)}
                    className="bg-red-500/30 hover:bg-red-500/50 px-3 py-1 rounded"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
