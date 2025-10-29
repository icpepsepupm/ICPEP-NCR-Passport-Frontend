"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { getCurrentUser, clearCurrentUser } from "@/app/lib/client-auth";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import Image from "next/image";
import activities from "@/app/data/activities.json";

type ActivityMap = Record<string, Array<{ id: number; slug: string; title: string }>>;
const ACT: ActivityMap = activities as ActivityMap;

export default function PassportPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = React.useState<ReturnType<typeof getCurrentUser> | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    setReady(true);
    if (!u) router.replace("/auth/login");
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

  // Encode a compact JSON payload the scanner can parse later (no activity type).
  const qrPayload = JSON.stringify({
    memberId: user.memberId,
    activityId: String(toNumericId),
  });

  return (
    <div className="relative min-h-dvh isolate overflow-hidden bg-black">
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

      <div className="relative mx-auto grid min-h-dvh max-w-7xl grid-cols-1 items-center gap-12 p-6 md:grid-cols-2">
        {/* Left: ID Card */}
        <div className="mx-auto w-[460px] max-w-[95vw] rounded-2xl border border-cyan-400/25 bg-[#0b0f13]/95 p-8 neon-panel backdrop-blur">
          <div className="mx-auto mb-2 text-center text-cyan-200/80">
            <div className="orbitron text-sm uppercase tracking-wider">passport</div>
            <div className="text-xs">{toNumericId}</div>
          </div>
          <div className="mx-auto mb-6 w-[260px] rounded-lg bg-black/40 p-3">
            <QRCodeSVG
              value={qrPayload}
              level="M"
              includeMargin
              size={220}
              bgColor="transparent"
              fgColor="#a5f3fc"
            />
          </div>
          <div className="space-y-5 text-center">
            <div>
              <div className="orbitron text-xl text-cyan-200">Name</div>
              <div className="text-base text-cyan-100/85">{user.name}</div>
            </div>
            <div>
              <div className="orbitron text-xl text-cyan-200">School</div>
              <div className="text-base text-cyan-100/85">{user.school ?? "—"}</div>
            </div>
            <div>
              <div className="orbitron text-xl text-cyan-200">Member ID</div>
              <div className="text-base text-cyan-100/85">{user.memberId}</div>
            </div>
            <div className="pt-2">
              <Link
                className="inline-flex h-10 items-center rounded-md bg-cyan-400 px-5 font-semibold text-black orbitron hover:bg-cyan-300"
                href="/badges"
              >
                View Badges
              </Link>
            </div>
            <button
              onClick={() => {
                clearCurrentUser();
                router.push("/auth/login");
              }}
              className="mt-2 text-xs text-cyan-200/70 underline-offset-4 hover:underline"
            >
              Log out
            </button>
          </div>
        </div>

        {/* Right: Big Logo */}
        <div className="hidden justify-center md:flex">
          <Image
            src="/ICpEP.SE Logo.png"
            alt="ICpEP.SE Logo"
            width={460}
            height={460}
            className="drop-shadow-[0_0_35px_rgba(34,211,238,0.35)]"
            priority
          />
        </div>
      </div>
    </div>
  );
}
