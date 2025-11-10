"use client";

import React from "react";

interface TabNavigationProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="flex gap-4 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`
            px-5 py-2 rounded-full font-semibold transition-all duration-300
            ${activeTab === tab 
              ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/40" 
              : "bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:shadow-sm hover:shadow-cyan-400/30"}
          `}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
}
