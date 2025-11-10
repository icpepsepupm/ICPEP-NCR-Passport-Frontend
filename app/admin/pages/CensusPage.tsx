"use client";

import React from "react";

export function CensusPage() {
  return (
    <div className="rounded-xl border border-cyan-400/15 p-6 backdrop-blur-sm transition-all duration-300 animate-fade-in">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4">Census</h2>
      <p className="text-cyan-200/70">This is the Census overview page.</p>
      {/* TODO: Add census summary, stats, or charts */}
    </div>
  );
}
