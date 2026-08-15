"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  open: boolean;
  message?: string;
};

/** Full-screen Indian Independence Day loader with tricolor confetti */
export function IndependenceLoader({
  open,
  message = "आपकी शिकायत तैयार की जा रही है…",
}: Props) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: `${(i * 17 + 7) % 100}%`,
        delay: `${(i % 12) * 0.12}s`,
        duration: `${2.2 + (i % 5) * 0.35}s`,
        color: i % 3 === 0 ? "#ff9933" : i % 3 === 1 ? "#ffffff" : "#138808",
        size: 6 + (i % 4) * 2,
        rotate: (i * 37) % 360,
      })),
    []
  );

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setTick((n) => n + 1), 400);
    return () => clearInterval(t);
  }, [open]);

  if (!open) return null;

  const dots = ".".repeat((tick % 3) + 1);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(7,26,58,0.82)] backdrop-blur-sm"
      role="alertdialog"
      aria-busy="true"
      aria-label="स्वतंत्रता दिवस — रिपोर्ट तैयार हो रही है"
    >
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {pieces.map((p) => (
          <span
            key={p.id}
            className="inde-confetti"
            style={{
              left: p.left,
              width: p.size,
              height: p.size * 1.4,
              background: p.color,
              animationDelay: p.delay,
              animationDuration: p.duration,
              ["--spin" as string]: `${p.rotate}deg`,
              border: p.color === "#ffffff" ? "1px solid #cbd5e1" : undefined,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-[var(--gold)]/50 bg-white shadow-2xl">
        <div className="tricolor-bar" />
        <div className="space-y-4 px-6 py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--gold)] bg-[var(--navy)] text-2xl shadow-lg">
            🇮🇳
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--gold)]">
              15 अगस्त · स्वतंत्रता दिवस
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--navy)]">जय हिंद</h2>
            <p className="mt-3 text-sm font-medium text-slate-700">
              {message}
              {dots}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              कृपया प्रतीक्षा करें — औपचारिक मसौदा तैयार हो रहा है
            </p>
          </div>

          <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
            <div className="inde-progress h-full rounded-full bg-gradient-to-r from-[#ff9933] via-white to-[#138808]" />
          </div>

          <p className="text-[11px] text-slate-400">
            सत्यमेव जयते · Police Complaint Assist
          </p>
        </div>
      </div>
    </div>
  );
}
