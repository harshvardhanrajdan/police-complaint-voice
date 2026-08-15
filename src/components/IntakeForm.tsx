"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SAMPLE_CASES } from "@/lib/samples";
import type { ComplaintInput } from "@/lib/types";
import { IndependenceLoader } from "./IndependenceLoader";
import { withIndependenceDelay } from "@/lib/with-independence-delay";

const empty: ComplaintInput = {
  complainantName: "",
  complainantPhone: "",
  occurrenceDate: "",
  occurrencePlace: "",
  policeStation: "",
  policeStationDistrict: "",
  policeStationState: "",
  policeStationPhone: "",
  accused: "",
  verbatimAccount: "",
  language: "hi",
};

const SAMPLE_LABELS: Record<string, string> = {
  "upi-fraud": "यूपीआई / ऑनलाइन धोखाधड़ी",
  theft: "मोबाइल चोरी",
  "threat-hi": "धमकी (हिंग्लिश)",
};

export function IntakeForm() {
  const router = useRouter();
  const [form, setForm] = useState<ComplaintInput>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);

  const canSubmit = useMemo(
    () => form.complainantName.trim().length > 1 && form.verbatimAccount.trim().length > 10,
    [form.complainantName, form.verbatimAccount]
  );

  function setField<K extends keyof ComplaintInput>(key: K, value: ComplaintInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function loadSample(id: string) {
    const sample = SAMPLE_CASES.find((s) => s.id === id);
    if (sample) {
      setForm({
        complainantName: sample.data.complainantName,
        complainantPhone: sample.data.complainantPhone,
        occurrenceDate: sample.data.occurrenceDate,
        occurrencePlace: sample.data.occurrencePlace,
        policeStation: sample.data.policeStation,
        policeStationDistrict: sample.data.policeStationDistrict,
        policeStationState: sample.data.policeStationState,
        policeStationPhone: sample.data.policeStationPhone,
        accused: sample.data.accused,
        verbatimAccount: sample.data.verbatimAccount,
        language: "hi",
      });
      setError(null);
    }
  }

  function startBrowserDictation() {
    const SR =
      typeof window !== "undefined"
        ? (
            window as unknown as {
              webkitSpeechRecognition?: new () => SpeechRecognition;
              SpeechRecognition?: new () => SpeechRecognition;
            }
          ).SpeechRecognition ||
          (
            window as unknown as {
              webkitSpeechRecognition?: new () => SpeechRecognition;
            }
          ).webkitSpeechRecognition
        : undefined;

    if (!SR) {
      setError("इस ब्राउज़र में आवाज़ टाइपिंग उपलब्ध नहीं है। कृपया बयान लिखें।");
      return;
    }

    const rec = new SR();
    rec.lang = "hi-IN";
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = form.verbatimAccount;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText = `${finalText}${finalText ? " " : ""}${piece}`.trim();
          setField("verbatimAccount", finalText);
        } else {
          interim += piece;
        }
      }
      if (interim) {
        setField("verbatimAccount", `${finalText}${finalText ? " " : ""}${interim}`.trim());
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    setListening(true);
    setError(null);
    rec.start();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await withIndependenceDelay(async () => {
        const res = await fetch("/api/complaints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, language: form.language || "hi" }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "मसौदा तैयार नहीं हो सका");
        return json;
      });
      // autoPdf=1 → review page downloads PDF automatically
      router.push(`${data.reviewPath}?autoPdf=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "कुछ गलत हो गया");
      setBusy(false);
    }
  }

  return (
    <>
      <IndependenceLoader open={busy} message="आपकी शिकायत का मसौदा तैयार किया जा रहा है" />
      <form onSubmit={onSubmit} className="space-y-5">
        <p className="rounded-lg border border-[var(--line)] bg-[#f7f9fc] px-3 py-2 text-sm text-slate-600">
          शिकायतकर्ता के विवरण और घटना के स्पष्ट तथ्य दर्ज करें। यह मसौदा थाने में जमा करने हेतु
          है; FIR पंजीकरण का निर्णय ड्यूटी अधिकारी का होगा।
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-slate-500">नमूना मामले</span>
          {SAMPLE_CASES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => loadSample(s.id)}
              className="rounded border border-[var(--line)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--navy)] hover:border-[var(--navy)]"
            >
              {SAMPLE_LABELS[s.id] || s.label}
            </button>
          ))}
        </div>

        <fieldset className="space-y-3">
          <legend className="section-title text-sm">शिकायतकर्ता</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="पूरा नाम *"
              value={form.complainantName}
              onChange={(v) => setField("complainantName", v)}
              required
            />
            <Field
              label="मोबाइल नंबर"
              value={form.complainantPhone || ""}
              onChange={(v) => setField("complainantPhone", v)}
            />
            <Field
              label="घटना का स्थान"
              value={form.occurrencePlace || ""}
              onChange={(v) => setField("occurrencePlace", v)}
            />
            <Field
              label="घटना की तिथि"
              value={form.occurrenceDate || ""}
              onChange={(v) => setField("occurrenceDate", v)}
              placeholder="YYYY-MM-DD"
            />
            <Field
              label="अभियुक्त (यदि ज्ञात)"
              value={form.accused || ""}
              onChange={(v) => setField("accused", v)}
              className="sm:col-span-2"
              placeholder="नाम / विवरण या अज्ञात"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="section-title text-sm">थाना / पुलिस स्टेशन</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="थाने का नाम"
              value={form.policeStation || ""}
              onChange={(v) => setField("policeStation", v)}
              placeholder="उदा. कनॉट प्लेस / पटेल नगर"
            />
            <Field
              label="थाने का फोन (यदि ज्ञात)"
              value={form.policeStationPhone || ""}
              onChange={(v) => setField("policeStationPhone", v)}
              placeholder="लैंडलाइन / कंट्रोल रूम"
            />
            <Field
              label="ज़िला"
              value={form.policeStationDistrict || ""}
              onChange={(v) => setField("policeStationDistrict", v)}
            />
            <Field
              label="राज्य / केंद्र शासित प्रदेश"
              value={form.policeStationState || ""}
              onChange={(v) => setField("policeStationState", v)}
              placeholder="उदा. दिल्ली"
            />
          </div>
        </fieldset>

        <div>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
            <label className="section-title text-sm">तथ्यों का कथन *</label>
            <div className="flex gap-2">
              <select
                className="field-input !w-auto py-1.5 text-xs"
                value={form.language || "hi"}
                onChange={(e) => setField("language", e.target.value)}
              >
                <option value="hi">हिंदी</option>
                <option value="en">अंग्रेज़ी</option>
              </select>
              <button
                type="button"
                onClick={startBrowserDictation}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  listening ? "bg-red-600 text-white" : "btn-ghost"
                }`}
              >
                {listening ? "सुन रहा है…" : "बोलकर लिखें"}
              </button>
            </div>
          </div>
          <textarea
            required
            rows={5}
            value={form.verbatimAccount}
            onChange={(e) => setField("verbatimAccount", e.target.value)}
            placeholder="घटना के तथ्य अपने शब्दों में लिखें…"
            className="field-input min-h-[8rem] resize-y leading-relaxed"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
            {error}
          </div>
        )}

        <div className="flex justify-end border-t border-[var(--line)] pt-4">
          <button
            type="submit"
            disabled={!canSubmit || busy}
            className="btn-primary rounded-lg px-6 py-2.5 text-sm"
          >
            {busy ? "मसौदा तैयार हो रहा है…" : "शिकायत मसौदा बनाएँ"}
          </button>
        </div>
      </form>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className = "",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field-input"
      />
    </label>
  );
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
