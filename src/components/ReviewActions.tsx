"use client";

import { useState } from "react";

export function ReviewActions({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/d/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={copyLink} className="btn-ghost rounded-md px-3 py-2 text-sm font-semibold">
        {copied ? "लिंक कॉपी हो गया" : "मसौदा लिंक कॉपी करें"}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="btn-primary rounded-md px-3 py-2 text-sm font-semibold"
      >
        प्रिंट / PDF सहेजें
      </button>
    </div>
  );
}
