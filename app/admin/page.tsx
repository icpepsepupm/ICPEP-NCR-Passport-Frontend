"use client";

import React from "react";
import { AdminHeader } from "./components/AdminHeader";
import { TabNavigation } from "./components/TabNavigation";

// Page Modules
import EventsPage from "./pages/EventsPage";
import MembersPage from "./pages/MembersPage";
import { ApprovalsPage } from "./pages/ApprovalsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { CensusPage } from "./pages/CensusPage";

export default function AdminPage() {
  const [activeTab, setActiveTab] = React.useState<
    "events" | "members" | "approvals" | "reports" | "census"
  >("events");

  return (
    <div
      className="relative min-h-dvh isolate overflow-hidden transition-colors duration-300"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* ✅ Neon Soft Glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(34,211,238,0.25), transparent 70%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(34,211,238,0.18), transparent 70%)",
        }}
      />

      {/* ✅ Main Container */}
      <div className="relative mx-auto max-w-7xl px-6 py-20">
        <AdminHeader name="Admin" backendAvailable={true} />

        {/* ✅ Tabs */}
        <div
          className="rounded-xl border border-cyan-400/15 p-4 backdrop-blur-sm mt-4 transition-all duration-300"
          style={{ background: "var(--card-bg)" }}
        >
          <TabNavigation
            tabs={["Events", "Members", "Approvals", "Reports", "Census"]}
            activeTab={activeTab}
            onTabChange={(tab) =>
              setActiveTab(
                tab.toLowerCase() as
                  | "events"
                  | "members"
                  | "approvals"
                  | "reports"
                  | "census"
              )
            }
          />
        </div>

        {/* ✅ Page Content */}
        <div className="mt-8 animate-fade-in">
          {activeTab === "events" && <EventsPage />}
          {activeTab === "members" && <MembersPage />}
          {activeTab === "approvals" && <ApprovalsPage />}
          {activeTab === "reports" && <ReportsPage />}
          {activeTab === "census" && <CensusPage />}
        </div>
      </div>
    </div>
  );
}
