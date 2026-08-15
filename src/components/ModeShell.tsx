"use client";

import { useState } from "react";
import { VoiceIntake } from "./VoiceIntake";
import { IntakeForm } from "./IntakeForm";

type Mode = "voice" | "form";

export function ModeShell() {
  const [mode, setMode] = useState<Mode>("voice");

  return (
    <div className="force-light bg-white">
      <div className="flex border-b border-[var(--line)] bg-[#f7f9fc] px-2 sm:px-4">
        <Tab active={mode === "voice"} onClick={() => setMode("voice")}>
          <MicIcon />
          मौखिक बयान
          <span className="ml-1.5 hidden rounded bg-[var(--navy)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--gold-bright)] sm:inline">
            आवाज़
          </span>
        </Tab>
        <Tab active={mode === "form"} onClick={() => setMode("form")}>
          <PenIcon />
          लिखित आवेदन
        </Tab>
      </div>
      <div className="bg-white p-4 sm:p-6">{mode === "voice" ? <VoiceIntake /> : <IntakeForm />}</div>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 border-b-[3px] px-4 py-3.5 text-sm font-bold transition ${
        active
          ? "border-[var(--gold)] text-[var(--navy)]"
          : "border-transparent text-slate-500 hover:text-[var(--navy)]"
      }`}
    >
      {children}
    </button>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="opacity-80">
      <path
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="opacity-80">
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M13 7l3 3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
