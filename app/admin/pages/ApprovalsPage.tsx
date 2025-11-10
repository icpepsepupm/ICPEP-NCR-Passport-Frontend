"use client";

import React from "react";

export function ApprovalsPage() {
  return (
    <div className="rounded-xl border border-cyan-400/15 p-6 backdrop-blur-sm transition-all duration-300 animate-fade-in">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4">Approvals</h2>
      <p className="text-cyan-200/70">This is the Approvals management page.</p>
      {/* TODO: Add approval table or modal components */}
    </div>
  );
}
