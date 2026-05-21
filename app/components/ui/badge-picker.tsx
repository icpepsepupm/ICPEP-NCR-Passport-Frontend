"use client";

import * as React from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/errors";
import { BADGE_PRESET_GROUPS, DEFAULT_EVENT_BADGE } from "@/lib/badges/presets";
import { BADGE_UPLOAD_ACCEPT, BADGE_UPLOAD_MAX_BYTES } from "@/lib/badges/utils";
import BadgeDisplay from "@/app/components/ui/badge-display";

type Tab = "presets" | "upload";

export type BadgePickerProps = {
  value?: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  eventId?: number;
  disabled?: boolean;
};

export default function BadgePicker({
  value,
  onChange,
  label = "Event badge",
  eventId,
  disabled,
}: BadgePickerProps) {
  const [tab, setTab] = React.useState<Tab>("presets");
  const [activeGroup, setActiveGroup] = React.useState(0);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    if (file.size > BADGE_UPLOAD_MAX_BYTES) {
      setUploadError("Image must be 2MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (eventId != null) formData.append("eventId", String(eventId));

      const result = await apiClient.upload<{ data: { url: string } }>(
        "/events/badge-upload",
        formData
      );
      onChange(result.data.url);
      setTab("upload");
    } catch (err) {
      setUploadError(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="md:col-span-2">
      <label
        className="mb-2 block text-[11px] font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>

      <div
        className="rounded-xl border border-cyan-400/25 p-4"
        style={{ background: "var(--input-bg)" }}
      >
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <BadgeDisplay value={value} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {value
                ? "This badge is shown when members earn a stamp for this event."
                : `No badge selected — defaults to ${DEFAULT_EVENT_BADGE} on member passports.`}
            </p>
            {value ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(null)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-200 disabled:opacity-50 cursor-pointer"
              >
                <X className="h-3 w-3" /> Clear badge
              </button>
            ) : null}
          </div>
        </div>

        <div className="mb-3 flex gap-2">
          {(
            [
              { id: "presets" as const, label: "Presets" },
              { id: "upload" as const, label: "Upload image" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => setTab(t.id)}
              className={`h-8 rounded-full px-4 text-[11px] transition-all cursor-pointer disabled:opacity-50 ${
                tab === t.id
                  ? "bg-cyan-400 text-black font-semibold"
                  : "border border-cyan-400/40 hover:border-cyan-300/60"
              }`}
              style={tab === t.id ? {} : { color: "var(--text-primary)" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "presets" ? (
          <>
            <div className="mb-2 flex flex-wrap gap-2">
              {BADGE_PRESET_GROUPS.map((g, idx) => (
                <button
                  key={g.label}
                  type="button"
                  disabled={disabled}
                  onClick={() => setActiveGroup(idx)}
                  className={`h-7 rounded-full px-3 text-[10px] cursor-pointer disabled:opacity-50 ${
                    activeGroup === idx
                      ? "border border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                      : "border border-cyan-400/25 text-cyan-100/70 hover:border-cyan-300/50"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <div className="grid max-h-40 grid-cols-[repeat(auto-fill,minmax(2.5rem,1fr))] gap-2 overflow-y-auto rounded-lg border border-cyan-400/15 p-2">
              {BADGE_PRESET_GROUPS[activeGroup].emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(emoji)}
                  title={emoji}
                  className={`grid aspect-square place-content-center rounded-lg border text-2xl transition-all cursor-pointer disabled:opacity-50 hover:border-cyan-300/50 ${
                    value === emoji
                      ? "border-cyan-400 bg-cyan-400/20 ring-1 ring-cyan-400/50"
                      : "border-cyan-400/20 bg-black/20"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept={BADGE_UPLOAD_ACCEPT}
              className="hidden"
              disabled={disabled || uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => fileRef.current?.click()}
              className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-cyan-400/35 text-sm transition-all hover:border-cyan-300/60 disabled:opacity-50 cursor-pointer"
              style={{ color: "var(--text-secondary)" }}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                  Uploading…
                </>
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-cyan-400/80" />
                  <span className="flex items-center gap-1 text-xs">
                    <Upload className="h-3.5 w-3.5" />
                    PNG, JPEG, WebP, or GIF (max 2MB)
                  </span>
                </>
              )}
            </button>
            {uploadError ? (
              <p className="text-xs text-rose-400">{uploadError}</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
