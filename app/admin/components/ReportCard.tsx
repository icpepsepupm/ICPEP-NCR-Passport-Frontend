"use client";

import React from "react";

interface ReportCardProps {
  title: string;
  value: string | number;
  description?: string;
}

export function ReportCard({ title, value, description }: ReportCardProps) {
  return (
    <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm hover:scale-105 transition-transform">
      <h3 className="text-cyan-300 font-semibold">{title}</h3>
      <p className="text-2xl font-bold text-white mt-2">{value}</p>
      {description && <p className="text-cyan-200/70 mt-1">{description}</p>}
    </div>
  );
}
