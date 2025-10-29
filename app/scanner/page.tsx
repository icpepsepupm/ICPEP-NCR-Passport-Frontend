"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/app/lib/client-auth";
import eventsSeed from "@/app/data/events.json";

type Log = { time: string; memberId: string; eventId: number; result: "success" | "duplicate" };

export default function ScannerPage() {
  const router = useRouter();
  const [selected, setSelected] = React.useState<number | "" | null>("");
  const [status, setStatus] = React.useState<string>("Camera idle");
  const [scanned, setScanned] = React.useState<string | null>(null);
  const [logs, setLogs] = React.useState<Log[]>([]);
  const [memberInput, setMemberInput] = React.useState("");

  type AdminEvent = { id: number; title: string; date: string; location: string; attendees: number; badgeEmoji?: string; details?: string };
  const [events, setEvents] = React.useState<AdminEvent[]>([]);
  const eventsKey = "icpep-events";
  const attendanceKey = "icpep-attendance";

  // Load events from localStorage or seed
  React.useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(eventsKey) : null;
      if (raw) {
        setEvents(JSON.parse(raw) as AdminEvent[]);
        return;
      }
    } catch {}
    setEvents(eventsSeed as AdminEvent[]);
  }, []);

  // Camera state
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [camState, setCamState] = React.useState<
    "idle" | "requesting" | "granted" | "denied" | "error"
  >("idle");
  const [camError, setCamError] = React.useState<string | null>(null);
  const lastScanRef = React.useRef<string | null>(null);
  const scanningRef = React.useRef(false);

  const user = getCurrentUser();

  const isScanner = user?.role === "scanner";

  const isSecure = typeof window !== "undefined" ? (window.isSecureContext || window.location.hostname === "localhost") : true;
  const autoReqRef = React.useRef(false);

  const requestCamera = React.useCallback(async () => {
    if (!isSecure) {
      setCamError("Camera access requires HTTPS or localhost.");
      setCamState("denied");
      setStatus("Camera blocked (insecure origin)");
      return;
    }

    try {
      setCamError(null);
      setCamState("requesting");
      setStatus("Requesting camera access…");
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      setStream(media);
      setCamState("granted");
      setStatus("Camera active");
    } catch (err: unknown) {
      console.error("getUserMedia error", err);
      let message = "Unable to access camera.";
      if (err && typeof err === "object" && "name" in err) {
        const name = (err as DOMException).name ?? "Error";
        if (name === "NotAllowedError") message = "Permission denied. Please allow camera access.";
        else if (name === "NotFoundError") message = "No camera found on this device.";
        else if (name === "NotReadableError") message = "Camera is in use by another application.";
      }
      setCamError(message);
      setCamState("denied");
      setStatus("Camera access denied");
    }
  }, [isSecure]);

  function stopCamera() {
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
    }
    setStream(null);
    setCamState("idle");
    setStatus("Camera idle");
  }

  React.useEffect(() => {
    if (!videoRef.current) return;
    if (stream) {
      videoRef.current.srcObject = stream;
      // play can reject if not allowed; ignore quietly
      void videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.srcObject = null;
    }
    return () => {
      // stop tracks when component unmounts or stream replaced
      if (stream) {
        for (const t of stream.getTracks()) t.stop();
      }
    };
  }, [stream]);

  // QR decode via BarcodeDetector when available
  // Stable log helper (for recent activity list)
  const log = React.useCallback((result: "success" | "duplicate") => {
    const mem = user?.memberId ?? "ICPEP-XXXX-XXX";
    const now = new Date();
    const entry: Log = {
      time: now.toLocaleTimeString(),
      memberId: mem,
      eventId: Number(selected) || 0,
      result,
    };
    setLogs((prev) => [entry, ...prev].slice(0, 6));
  }, [selected, user?.memberId]);

  // Update attendee count on event and persist
  const updateEventAttendeeCount = React.useCallback((eventId: number, count: number) => {
    try {
      const raw = localStorage.getItem(eventsKey);
      const list: AdminEvent[] = raw ? JSON.parse(raw) : (eventsSeed as AdminEvent[]);
      const updated = list.map((e) => (e.id === eventId ? { ...e, attendees: count } : e));
      localStorage.setItem(eventsKey, JSON.stringify(updated));
      setEvents(updated);
    } catch {}
  }, [eventsKey]);

  // Record attendance and update event counts
  const grantAttendance = React.useCallback((memberId: string, eventId: number): "success" | "duplicate" => {
    if (!memberId) return "duplicate";
    try {
      const raw = localStorage.getItem(attendanceKey);
      const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
      const key = String(eventId);
      const set = new Set([...(map[key] ?? [])]);
      if (set.has(memberId)) {
        setScanned(memberId);
        setStatus("Duplicate scan — already granted for this event.");
        return "duplicate";
      }
      set.add(memberId);
      const arr = Array.from(set);
      const next = { ...map, [key]: arr };
      localStorage.setItem(attendanceKey, JSON.stringify(next));
      // Update attendee count in events
      updateEventAttendeeCount(eventId, arr.length);
      setStatus("Scan successful — badge granted.");
      setScanned(null);
      return "success";
    } catch {
      setStatus("Error recording attendance");
      return "duplicate";
    }
  }, [attendanceKey, updateEventAttendeeCount]);

  const handleDecodedPayload = React.useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(raw) as { memberId?: string; activityId?: string | number };
      const memberId = (parsed.memberId ?? "").toString().trim();
      const evId = parsed.activityId != null ? Number(parsed.activityId) : (selected ? Number(selected) : NaN);
      if (!memberId) {
        setStatus("QR missing memberId");
        return;
      }
      if (!Number.isFinite(evId)) {
        setStatus("QR missing activityId — select an event to use instead");
        if (selected) {
          const outcome = grantAttendance(memberId, Number(selected));
          log(outcome);
        }
        return;
      }
      // Validate the event exists
      const exists = events.some((e) => e.id === evId);
      const eventIdToUse = exists ? evId : (selected ? Number(selected) : NaN);
      if (!Number.isFinite(eventIdToUse)) {
        setStatus("Unknown event — select an event first");
        return;
      }
      const outcome = grantAttendance(memberId, Number(eventIdToUse));
      log(outcome);
    } catch {
      // Not JSON? ignore but surface brief status
      setStatus("Unrecognized QR content");
    }
  }, [events, selected, grantAttendance, log]);

  React.useEffect(() => {
    let raf = 0;
    async function tick() {
      if (!videoRef.current || !('BarcodeDetector' in window)) {
        raf = window.requestAnimationFrame(tick);
        return;
      }
      try {
        // @ts-expect-error: BarcodeDetector is a newer web API
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const codes = await detector.detect(videoRef.current);
        if (codes && codes.length > 0) {
          const raw = codes[0].rawValue || codes[0].raw || "";
          if (raw && raw !== lastScanRef.current) {
            lastScanRef.current = raw;
            handleDecodedPayload(raw);
          }
        }
      } catch {
        // ignore detection errors; continue trying
      }
      raf = window.requestAnimationFrame(tick);
    }
    if (camState === "granted" && stream && !scanningRef.current) {
      scanningRef.current = true;
      raf = window.requestAnimationFrame(tick);
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
      scanningRef.current = false;
    };
  }, [camState, stream, handleDecodedPayload]);

  // Politely prompt for camera on page load for scanner role
  React.useEffect(() => {
    if (isScanner && !autoReqRef.current && camState === "idle" && isSecure) {
      autoReqRef.current = true;
      void requestCamera();
    }
  }, [isScanner, camState, isSecure, requestCamera]);

  

  

  

  function simulateScan(result: "success" | "duplicate") {
    if (!selected) return setStatus("Select an event first");
    const mem = memberInput.trim() || user?.memberId || "ICPEP-XXXX-XXX";
    const outcome = result === "success" ? grantAttendance(mem, Number(selected)) : "duplicate";
    log(outcome);
  }

  return (
    <div className="relative min-h-dvh isolate overflow-hidden bg-black text-cyan-50">
      {/* soft glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.25), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(34,211,238,0.18), transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/ICpEP.SE Logo.png" alt="logo" width={28} height={28} />
            <div>
              <div className="orbitron text-lg leading-none">QR SCANNER</div>
              <div className="text-[10px] text-cyan-200/60">event check-in system</div>
            </div>
          </div>
          <button
            onClick={() => {
              try {
                window.localStorage.removeItem("icpep-user");
              } catch {}
              router.push("/auth/login");
            }}
            className="h-8 rounded-md border border-cyan-400/40 px-3 text-[11px] text-cyan-100/90 transition hover:border-cyan-300/60"
          >
            Log out
          </button>
        </header>

        {!isScanner ? (
          <div className="mt-6 rounded-xl border border-yellow-400/30 bg-yellow-900/20 p-4 text-sm">
            Access restricted. This page is for scanner role accounts. Please log in as a scanner user.
          </div>
        ) : null}

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[1fr_340px]">
          {/* Scanner panel */}
          <div className="rounded-2xl border border-cyan-400/25 bg-[#0b0f13]/90 p-6 neon-panel">
            <div className="flex items-center justify-between">
              <h2 className="orbitron text-lg">Scan QR Code</h2>
              <div className="flex items-center gap-3">
                {stream ? (
                  <button
                    onClick={stopCamera}
                    className="h-8 rounded-md border border-cyan-400/40 px-2 text-[11px] text-cyan-100/90 transition hover:border-cyan-300/60"
                  >
                    Disable Camera
                  </button>
                ) : (
                  <button
                    onClick={requestCamera}
                    className="h-8 rounded-md bg-cyan-400 px-2 text-[11px] font-semibold text-black orbitron transition-colors hover:bg-cyan-300"
                    disabled={camState === "requesting"}
                  >
                    {camState === "requesting" ? "Requesting…" : "Enable Camera"}
                  </button>
                )}
                <div className="text-xs text-cyan-200/70">Status: {status}</div>
              </div>
            </div>
            <p className="mb-4 mt-1 text-xs text-cyan-100/70">Point camera at member QR Code to check them in</p>

            <div className="rounded-xl border border-cyan-400/25 bg-black/40 p-6">
              <div className="relative mx-auto h-[340px] max-w-[520px] overflow-hidden rounded-[20px] border-2 border-dashed border-cyan-400/30 bg-gradient-to-b from-cyan-400/5 to-transparent">
                {stream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-content-center text-center">
                    <div className="text-5xl text-cyan-200/80">📷</div>
                    <p className="mt-2 text-xs text-cyan-100/80">Camera is not enabled.</p>
                    {!isSecure ? (
                      <p className="mt-1 text-[11px] text-yellow-200/80">Use HTTPS or localhost to allow camera access.</p>
                    ) : null}
                    {camError ? (
                      <p className="mt-1 text-[11px] text-yellow-200/80">{camError}</p>
                    ) : null}
                    {!("BarcodeDetector" in window) ? (
                      <p className="mt-1 text-[11px] text-cyan-200/70">This browser may not support live QR decoding. Use the Simulate buttons below or try a Chromium-based browser.</p>
                    ) : null}
                    <div className="mt-3">
                      <button
                        onClick={requestCamera}
                        disabled={camState === "requesting"}
                        className="h-9 rounded-md bg-cyan-400 px-3 text-sm font-semibold text-black orbitron transition-colors hover:bg-cyan-300 disabled:opacity-60"
                      >
                        {camState === "requesting" ? "Requesting…" : "Enable Camera"}
                      </button>
                    </div>
                  </div>
                )}

                {/* corner guides */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-3 top-3 h-8 w-8 border-l-4 border-t-4 border-cyan-400/60" />
                  <div className="absolute right-3 top-3 h-8 w-8 border-r-4 border-t-4 border-cyan-400/60" />
                  <div className="absolute bottom-3 left-3 h-8 w-8 border-b-4 border-l-4 border-cyan-400/60" />
                  <div className="absolute bottom-3 right-3 h-8 w-8 border-b-4 border-r-4 border-cyan-400/60" />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => simulateScan("success")}
                className="h-10 rounded-md bg-cyan-400 text-sm font-semibold text-black orbitron transition-colors hover:bg-cyan-300"
              >
                Simulate Successful Scan
              </button>
              <button
                onClick={() => simulateScan("duplicate")}
                className="h-10 rounded-md border border-cyan-400/40 text-sm text-cyan-100/90 transition hover:border-cyan-300/60"
              >
                Simulate Duplicate Scan
              </button>
            </div>

            {/* Recent logs */}
            <div className="mt-6 rounded-xl border border-cyan-400/20 bg-black/30 p-4">
              <div className="orbitron text-sm">Recent Activity</div>
              {logs.length === 0 ? (
                <p className="mt-2 text-xs text-cyan-100/70">No scans yet.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-xs">
                  {logs.map((l, i) => (
                    <li key={i} className="flex items-center justify-between rounded-md border border-cyan-400/10 bg-black/30 px-3 py-2">
                      <span className="text-cyan-100/80">{l.time}</span>
                      <span className="text-cyan-100/80">Event #{l.eventId}</span>
                      <span className="text-cyan-100/80">{l.memberId}</span>
                      <span className={l.result === "success" ? "text-emerald-300" : "text-yellow-300"}>
                        {l.result === "success" ? "granted" : "duplicate"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Side panels */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-cyan-400/25 bg-[#0b0f13]/90 p-4 neon-panel">
              <div className="orbitron text-sm">Select Event</div>
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={selected ?? ""}
                  onChange={(e) => setSelected(e.target.value === "" ? "" : Number(e.target.value))}
                  className="h-10 w-full rounded-md border border-cyan-400/40 bg-transparent px-3 text-sm outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30"
                >
                  <option value="" className="bg-[#0b0f13]">Choose an event</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id} className="bg-[#0b0f13]">
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-xs text-cyan-200/80">Member ID to simulate</label>
                <input
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  placeholder="e.g. IC-2025-0001"
                  className="h-10 w-full rounded-md border border-cyan-400/40 bg-transparent px-3 text-sm outline-none placeholder:text-cyan-200/50 focus:border-cyan-300"
                />
                <p className="mt-1 text-[11px] text-cyan-200/60">Used by the simulate buttons when testing.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-400/30 bg-yellow-900/20 p-4">
              <div className="orbitron text-sm">Already scanned</div>
              <p className="mt-1 text-xs text-yellow-200/80">
                {scanned
                  ? `Member ${scanned} has already scanned this event`
                  : "No duplicate scans in this session."}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
