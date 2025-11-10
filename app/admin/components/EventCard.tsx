"use client";

import React from "react";

interface EventCardProps {
  name: string;
  date: string;
  venue: string;
}

export function EventCard({ name, date, venue }: EventCardProps) {
  return (
    <div className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm hover:scale-105 transition-transform">
      <h3 className="text-cyan-300 font-semibold">{name}</h3>
      <p className="text-cyan-200/70">Date: {date}</p>
      <p className="text-cyan-200/70">Venue: {venue}</p>
    </div>
  );
}
