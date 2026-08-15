"use client";

import { useState } from "react";
import { AutoDownloadPdf } from "./AutoDownloadPdf";

export function ReviewActions({
  token,
  autoPdf = false,
  complainantName,
}: {
  token: string;
  autoPdf?: boolean;
  complainantName?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/d/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AutoDownloadPdf token={token} auto={autoPdf} complainantName={complainantName} />
      <button
        type="button"
        onClick={copyLink}
        className="btn-ghost rounded-md px-3 py-2 text-sm font-semibold"
      >
        {copied ? "लिंक कॉपी हो गया" : "मसौदा लिंक कॉपी करें"}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="btn-ghost rounded-md px-3 py-2 text-sm font-semibold"
      >
        प्रिंट करें
      </button>
    </div>
  );
}
