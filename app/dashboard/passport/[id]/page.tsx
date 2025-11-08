"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { getCurrentUser, clearCurrentUser } from "@/app/lib/client-auth";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import IcpepCoin from "@/app/components/three/IcpepCoin";
import Modal from "@/app/components/ui/modal";
import activities from "@/app/data/activities.json";

type ActivityMap = Record<string, Array<{ id: number; slug: string; title: string }>>;
const ACT: ActivityMap = activities as ActivityMap;

// Allowed roles for this page
const ALLOWED_ROLES = ["member", "student"]; // <-- change to your roles

export default function PassportPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = React.useState<ReturnType<typeof getCurrentUser> | null>(null);
  const [ready, setReady] = React.useState(false);
  const [qrColor, setQrColor] = React.useState("#22d3ee");
  const [qrZoomed, setQrZoomed] = React.useState(false);
  const [qrBgColor, setQrBgColor] = React.useState("rgba(0, 0, 0, 0.3)");

  // Initialize user and check role
  React.useEffect(() => {
    const u = getCurrentUser();
    const role = (u?.role ?? "").toLowerCase();
    if (!u || !role || !ALLOWED_ROLES.includes(role)) {
      clearCurrentUser(); // clear invalid user
      router.replace("/auth/login"); // redirect
      return;
    }
    setUser(u);
    setReady(true);

    // Set initial QR color based on theme
    const isLight = document.documentElement.classList.contains("light");
    setQrColor(isLight ? "#000000" : "#22d3ee");
    setQrBgColor(isLight ? "#ffffff" : "rgba(0, 0, 0, 0.3)");

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      const isLight = document.documentElement.classList.contains("light");
      setQrColor(isLight ? "#000000" : "#22d3ee");
      setQrBgColor(isLight ? "#ffffff" : "rgba(0, 0, 0, 0.3)");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [router]);

  const isDigits = /^\d+$/.test(id);
  const toNumericId = React.useMemo(() => {
    if (isDigits) return parseInt(id, 10);
    // Fallback: resolve slug across all activity categories
    for (const list of Object.values(ACT)) {
      const found = list.find((a) => a.slug === id);
      if (found) return found.id;
    }
    return 1;
  }, [id, isDigits]);

  // Normalize to numeric id in URL
  React.useEffect(() => {
    if (!isDigits) {
      router.replace(`/dashboard/passport/${toNumericId}`);
    }
  }, [isDigits, toNumericId, router]);

  if (!ready || !user) return null;

  const qrPayload = JSON.stringify({
    memberId: user.memberId,
    activityId: String(toNumericId),
  });

  return (
    <div className="relative min-h-dvh isolate overflow-hidden transition-colors duration-300" style={{ background: "var(--background)" }}>
      {/* Background blobs */}
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full blur-3xl transition-opacity duration-300" style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.25), transparent 70%)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl transition-opacity duration-300" style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.18), transparent 70%)" }} />

      <div className="relative mx-auto grid min-h-dvh max-w-7xl grid-cols-1 items-center gap-8 p-6 lg:grid-cols-2 lg:gap-12">
        {/* Left: ID Card */}
        <div className="mx-auto w-full max-w-[460px] rounded-2xl border border-cyan-400/25 p-6 sm:p-8 neon-panel backdrop-blur animate-slide-up transition-all duration-300" style={{ background: "var(--card-bg)" }}>
          <div className="mx-auto mb-2 text-center animate-fade-in stagger-1 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
            <div className="orbitron text-sm uppercase tracking-wider text-cyan-400">passport</div>
            <div className="text-xs">{toNumericId}</div>
          </div>
          <div className="mx-auto mb-6 w-full max-w-[260px] rounded-lg p-3 transition-all duration-300 hover:scale-105 animate-fade-in stagger-2 cursor-pointer" style={{ background: "var(--input-bg)" }} onClick={() => setQrZoomed(true)}>
            <QRCodeSVG value={qrPayload} level="M" includeMargin size={220} bgColor="transparent" fgColor={qrColor} className="w-full h-auto" />
          </div>
          <div className="space-y-5 text-center">
            <div className="animate-fade-in stagger-3">
              <div className="orbitron text-xl text-cyan-400">Name</div>
              <div className="text-base transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{user.name}</div>
            </div>
            <div className="animate-fade-in stagger-4">
              <div className="orbitron text-xl text-cyan-400">School</div>
              <div className="text-base transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{user.school ?? "—"}</div>
            </div>
            <div className="animate-fade-in stagger-4">
              <div className="orbitron text-xl text-cyan-400">Member ID</div>
              <div className="text-base transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{user.memberId}</div>
            </div>
            <div className="pt-2 animate-fade-in stagger-4">
              <Link className="inline-flex h-10 items-center rounded-md bg-cyan-400 px-5 font-semibold text-black orbitron hover:bg-cyan-300 transition-all duration-200 hover:scale-105 active:scale-95" href="/badges">
                View Badges
              </Link>
            </div>
            <button onClick={() => { clearCurrentUser(); router.push("/auth/login"); }} className="mt-2 text-xs underline-offset-4 hover:underline transition-all duration-200 cursor-pointer" style={{ color: "var(--text-muted)" }}>
              Log out
            </button>
          </div>
        </div>

        {/* Right: 3D Coin */}
        <div className="hidden lg:block animate-fade-in">
          <div className="r3f-transparent relative h-[460px] w-full rounded-2xl">
            <IcpepCoin />
          </div>
        </div>
      </div>

      {/* QR Code Zoom Modal */}
      <Modal open={qrZoomed} onClose={() => setQrZoomed(false)} title="QR Code">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-lg p-4 sm:p-6 transition-all duration-300 w-full max-w-[450px]" style={{ backgroundColor: qrBgColor }}>
            <QRCodeSVG value={qrPayload} level="M" includeMargin size={400} bgColor="transparent" fgColor={qrColor} className="w-full h-auto" />
          </div>
          <p className="text-sm text-center transition-colors duration-300 px-4" style={{ color: "var(--text-secondary)" }}>
            Scan this QR code to check in at events
          </p>
        </div>
      </Modal>
    </div>
  );
}
