"use client";

import * as React from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      aria-modal
      role="dialog"
    >
      <div
        className="neon-panel w-[min(92vw,680px)] rounded-2xl border border-cyan-400/25 bg-[#0b0f13]/95 p-6 text-cyan-50 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          {title ? (
            <h2 className="orbitron text-xl tracking-wide text-cyan-100">{title}</h2>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-cyan-400/30 text-cyan-200 hover:bg-cyan-400/10"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
