"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { clearCurrentUser, getDisplayName, BasicUser } from "@/app/lib/client-auth";
import Link from "next/link";
import IcpepCoin from "@/app/components/three/IcpepCoin";
import Modal from "@/app/components/ui/modal";
import Image from "next/image";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const ALLOWED_ROLES = ["member"];

interface School {
  id: number;
  name: string;
  code: string;
}

interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  schoolId?: number;
  school?: School;
  memberId: string;
  qrCodeUrl?: string; // ✅ Add qrCodeUrl field
}

export default function PassportPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = React.useState<UserResponse | null>(null);
  const [ready, setReady] = React.useState(false);
  const [qrZoomed, setQrZoomed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/users/${id}`);
        if (!res.ok) throw new Error(`Failed to fetch user: ${res.statusText}`);
        const data: UserResponse = await res.json();

        // Only allow "member" role
        if (data.role.toLowerCase() !== "member") {
          clearCurrentUser();
          router.replace("/auth/login");
          return;
        }

        // ✅ Fetch school details if schoolId exists
        if (data.schoolId) {
          try {
            const schoolRes = await fetch(`${API_BASE_URL}/schools/${data.schoolId}`);
            if (schoolRes.ok) {
              const schoolData: School = await schoolRes.json();
              data.school = schoolData;
            }
          } catch (schoolErr: any) {
            console.warn("School fetch failed:", schoolErr.message);
          }
        }

        setUser(data);
        setReady(true);
      } catch (err: any) {
        setError(err.message || "Failed to load user info.");
        setReady(true);
      }
    };

    fetchUser();
  }, [id, router]);

  if (!ready) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>User not found</p>;

  const displayUser: BasicUser = {
    firstName: user.firstName,
    lastName: user.lastName,
    memberId: user.memberId,
    role: user.role.toLowerCase() as "member" | "admin" | "scanner",
  };

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
            <div className="text-xs">{user.id}</div>
          </div>

          {/* ✅ Display QR Code from qrCodeUrl or fallback message */}
          <div className="mx-auto mb-6 w-full max-w-[260px] rounded-lg p-3 transition-all duration-300 hover:scale-105 animate-fade-in stagger-2 cursor-pointer" style={{ background: "var(--input-bg)" }} onClick={() => user.qrCodeUrl && setQrZoomed(true)}>
            {user.qrCodeUrl ? (
              <div className="relative w-full aspect-square">
                <Image 
                  src={user.qrCodeUrl} 
                  alt="QR Code"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full aspect-square text-center p-4" style={{ color: "var(--text-muted)" }}>
                <p className="text-sm">QR Code not generated yet</p>
              </div>
            )}
          </div>

          <div className="space-y-5 text-center">
            <div className="animate-fade-in stagger-3">
              <div className="orbitron text-xl text-cyan-400">Name</div>
              <div className="text-base transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                {getDisplayName(displayUser)}
              </div>
            </div>
            <div className="animate-fade-in stagger-4">
              <div className="orbitron text-xl text-cyan-400">School</div>
              <div className="text-base transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                {user.school ? `${user.school.name} (${user.school.code})` : "—"}
              </div>
            </div>
            <div className="animate-fade-in stagger-4">
              <div className="orbitron text-xl text-cyan-400">Member ID</div>
              <div className="text-base transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>{user.memberId}</div>
            </div>
            <div className="pt-2 animate-fade-in stagger-4">
              <Link className="inline-flex h-10 items-center rounded-md bg-cyan-400 px-5 font-semibold text-black orbitron hover:bg-cyan-300 transition-all duration-200 hover:scale-105 active:scale-95" href={`/dashboard/badges/${id}`}>
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

      {/* ✅ QR Code Zoom Modal */}
      {user.qrCodeUrl && (
        <Modal open={qrZoomed} onClose={() => setQrZoomed(false)} title="QR Code">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg p-4 sm:p-6 transition-all duration-300 w-full max-w-[450px]" style={{ background: "var(--input-bg)" }}>
              <div className="relative w-full aspect-square">
                <Image 
                  src={user.qrCodeUrl} 
                  alt="QR Code"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
            <p className="text-sm text-center transition-colors duration-300 px-4" style={{ color: "var(--text-secondary)" }}>
              Scan this QR code to check in at events
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}