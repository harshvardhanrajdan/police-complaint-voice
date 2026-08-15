"use client";

import { useEffect, useRef, useState } from "react";
import { downloadComplaintPdf } from "@/lib/download-complaint-pdf";

type Props = {
  token: string;
  /** When true (from ?autoPdf=1), download PDF once after mount */
  auto: boolean;
  complainantName?: string;
};

/**
 * Automatically generates and downloads a PDF of the complaint after draft creation.
 */
export function AutoDownloadPdf({ token, auto, complainantName }: Props) {
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function runDownload() {
    setStatus("working");
    setError(null);
    try {
      const el = document.getElementById("complaint-print-root");
      if (!el) throw new Error("मसौदा दस्तावेज़ नहीं मिला");

      // Brief pause for images/fonts
      await new Promise((r) => setTimeout(r, 600));

      const namePart = (complainantName || "shikayat").replace(/\s+/g, "-").slice(0, 40);
      const fileName = `police-complaint-${namePart}-${token.slice(0, 8)}.pdf`;
      await downloadComplaintPdf(el, fileName);
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "PDF नहीं बन सका");
    }
  }

  useEffect(() => {
    if (!auto || started.current) return;
    started.current = true;
    void runDownload();
  }, [auto]);

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      {status === "working" && (
        <span className="rounded-full border border-[var(--gold)]/50 bg-[var(--gold-soft)] px-3 py-1.5 text-xs font-semibold text-[#6b5208]">
          🇮🇳 PDF तैयार हो रहा है… स्वतः डाउनलोड होगा
        </span>
      )}
      {status === "done" && (
        <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900">
          PDF डाउनलोड हो गया
        </span>
      )}
      {status === "error" && (
        <span className="rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800">
          {error || "PDF त्रुटि"} — नीचे बटन से पुनः प्रयास करें
        </span>
      )}
      <button
        type="button"
        onClick={() => void runDownload()}
        disabled={status === "working"}
        className="btn-primary rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-60"
      >
        {status === "working" ? "PDF बन रहा है…" : "PDF डाउनलोड करें"}
      </button>
    </div>
  );
}
