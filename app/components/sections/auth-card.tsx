import Image from "next/image";
import * as React from "react";

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative mx-auto w-[420px] max-w-[92vw] rounded-2xl border border-cyan-400/25 bg-[#0b0f13]/95 p-8 neon-panel backdrop-blur animate-scale-in">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/ICpEP.SE Logo.png"
          alt="ICpEP.SE Logo"
          width={88}
          height={88}
          priority
          className="drop-shadow-[0_0_20px_rgba(34,211,238,0.35)] animate-fade-in stagger-1"
        />
        <h1 className="orbitron text-3xl font-semibold tracking-wider text-cyan-100 animate-fade-in stagger-2">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-center text-sm text-cyan-100/70 animate-fade-in stagger-3">{subtitle}</p>
        ) : null}
      </div>
      <div className="mt-6 animate-fade-in stagger-4">{children}</div>
    </div>
  );
}
