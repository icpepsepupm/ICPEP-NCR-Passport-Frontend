"use client";

import dynamic from "next/dynamic";

const ScannerClient = dynamic(() => import("./Client"), { ssr: false });

export default function Page() {
  return <ScannerClient />;
}
