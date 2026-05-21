"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { getDisplayName, signOutAndClear, BasicUser } from "@/app/lib/client-auth";
import Link from "next/link";
import IcpepCoin from "@/app/components/three/IcpepCoin";
import Modal from "@/app/components/ui/modal";
import Image from "next/image";
import { apiClient } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import type { ClientUser } from "@/lib/api/mappers";

type School = { id: number; name: string; code: string };
type UserResponse = ClientUser & { school?: School | null };

export default function PassportPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [user, setUser] = React.useState<UserResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [qrZoomed, setQrZoomed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchUser = React.useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<{ data: UserResponse }>(`/users/${id}`);
      const data = result.data;

      if (data.role.toLowerCase() !== "member") {
        await signOutAndClear();
        router.replace("/auth/login");
        return;
      }

      setUser(data);
    } catch (err) {
      setError(getErrorMessage(err));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  React.useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-12 h-12 rounded-full border-4 border-cyan-400/20 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6" style={{ background: "var(--background)" }}>
        <p className="text-red-400">{error}</p>
        <button onClick={() => void fetchUser()} className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-semibold text-black">Retry</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center" style={{ background: "var(--background)" }}>
        <p style={{ color: "var(--text-secondary)" }}>User not found</p>
      </div>
    );
  }

  const displayUser: BasicUser = {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    memberId: user.memberId ?? "",
    role: user.role.toLowerCase() as "member" | "admin" | "scanner",
  };

  return (
    <div className="relative min-h-dvh isolate overflow-hidden transition-colors duration-300" style={{ background: "var(--background)" }}>
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.25), transparent 70%)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.18), transparent 70%)" }} />

      <div className="relative mx-auto grid min-h-dvh max-w-7xl grid-cols-1 items-center gap-8 p-6 lg:grid-cols-2 lg:gap-12">
        <div className="mx-auto w-full max-w-[460px] rounded-2xl border border-cyan-400/25 p-6 sm:p-8 neon-panel backdrop-blur animate-slide-up" style={{ background: "var(--card-bg)" }}>
          <div className="mx-auto mb-2 text-center" style={{ color: "var(--text-secondary)" }}>
            <div className="orbitron text-sm uppercase tracking-wider text-cyan-400">passport</div>
            <div className="text-xs">{user.id}</div>
          </div>

          <div className="mx-auto mb-6 w-full max-w-[260px] rounded-lg p-3 cursor-pointer hover:scale-105 transition-all" style={{ background: "var(--input-bg)" }} onClick={() => user.qrCodeUrl && setQrZoomed(true)}>
            {user.qrCodeUrl ? (
              <div className="relative w-full aspect-square">
                <Image src={user.qrCodeUrl} alt="QR Code" fill className="object-contain" unoptimized />
              </div>
            ) : (
              <div className="flex items-center justify-center w-full aspect-square text-center p-4" style={{ color: "var(--text-muted)" }}>
                <p className="text-sm">QR Code not generated yet</p>
              </div>
            )}
          </div>

          <div className="space-y-5 text-center">
            <div>
              <div className="orbitron text-xl text-cyan-400">Name</div>
              <div className="text-base" style={{ color: "var(--text-secondary)" }}>{getDisplayName(displayUser)}</div>
            </div>
            <div>
              <div className="orbitron text-xl text-cyan-400">School</div>
              <div className="text-base" style={{ color: "var(--text-secondary)" }}>
                {user.school ? `${user.school.name} (${user.school.code})` : "—"}
              </div>
            </div>
            <div>
              <div className="orbitron text-xl text-cyan-400">Member ID</div>
              <div className="text-base" style={{ color: "var(--text-secondary)" }}>{user.memberId ?? "—"}</div>
            </div>
            <div className="pt-2">
              <Link className="inline-flex h-10 items-center rounded-md bg-cyan-400 px-5 font-semibold text-black orbitron hover:bg-cyan-300" href={`/dashboard/badges/${id}`}>
                View Badges
              </Link>
            </div>
            <button onClick={() => { void signOutAndClear().then(() => router.push("/auth/login")); }} className="mt-2 text-xs underline-offset-4 hover:underline cursor-pointer" style={{ color: "var(--text-muted)" }}>
              Log out
            </button>
          </div>
        </div>

        <div className="hidden lg:block animate-fade-in">
          <div className="r3f-transparent relative h-[460px] w-full rounded-2xl">
            <IcpepCoin />
          </div>
        </div>
      </div>

      {user.qrCodeUrl && (
        <Modal open={qrZoomed} onClose={() => setQrZoomed(false)} title="QR Code">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg p-4 w-full max-w-[450px]" style={{ background: "var(--input-bg)" }}>
              <div className="relative w-full aspect-square">
                <Image src={user.qrCodeUrl} alt="QR Code" fill className="object-contain" unoptimized />
              </div>
            </div>
            <p className="text-sm text-center px-4" style={{ color: "var(--text-secondary)" }}>Scan this QR code to check in at events</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
