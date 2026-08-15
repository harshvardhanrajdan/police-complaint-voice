"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ComplaintInput } from "@/lib/types";
import { IndependenceLoader } from "./IndependenceLoader";
import { withIndependenceDelay } from "@/lib/with-independence-delay";

type FieldKey = keyof ComplaintInput;

type ChatLine = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
};

type Status = "idle" | "connecting" | "live" | "finalizing" | "error" | "ended";

/** Only show the basics we actually ask for */
const FIELD_LABELS: Record<string, string> = {
  complainantName: "नाम",
  complainantPhone: "मोबाइल",
  occurrencePlace: "घटना स्थल",
  occurrenceDate: "तिथि",
  occurrenceTime: "समय",
  policeStation: "थाना",
  policeStationDistrict: "ज़िला",
  policeStationState: "राज्य",
  policeStationPhone: "थाने का फोन",
  accused: "अभियुक्त",
};

function emptyFields(): Partial<ComplaintInput> {
  return {};
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/** Drop echo / noise / policy-model junk that is clearly not the citizen */
function isLikelyUserSpeech(text: string): boolean {
  const t = text.trim();
  if (t.length < 2) return false;
  // Very short pure Latin filler
  if (/^(hi|hey|hello|ok|okay|hmm+|uh+|um+|hej)$/i.test(t)) {
    // Allow real "hello" only if longer context isn't required — still accept short Hindi yes/no later
    if (/^(hmm+|uh+|um+|hej)$/i.test(t)) return false;
  }
  // Known garbage patterns from bad STT / model bleed
  const junk =
    /policies have already|system is capable|tools you can|comparable policies|skatehouse|this is the part we are not done|output_audio|function_call|session\.update/i;
  if (junk.test(t)) return false;
  // Pure CJK / kana noise bursts with no Devanagari/Latin letters of name-like length
  if (/^[\u3040-\u30ff\u3400-\u9fff\u3000-\u303f\s。.]+$/.test(t) && t.length < 12) {
    return false;
  }
  return true;
}

export function VoiceIntake() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [voiceReady, setVoiceReady] = useState<boolean | null>(null);
  const [fields, setFields] = useState<Partial<ComplaintInput>>(emptyFields);
  const [verbatim, setVerbatim] = useState("");
  const [capturingVerbatim, setCapturingVerbatim] = useState(false);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const fieldsRef = useRef(fields);
  const verbatimRef = useRef(verbatim);
  const capturingRef = useRef(false);
  const userChunksRef = useRef<string[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  /** Mute mic while agent talks — stops speaker→mic echo loops */
  const agentSpeakingRef = useRef(false);
  const muteUntilRef = useRef(0);
  const assistantBufRef = useRef("");
  const assistantLineIdRef = useRef<string | null>(null);
  const lastUserTextRef = useRef("");
  /** Last finalized desk-officer message (normalized) — blocks double done events */
  const lastAssistantFinalRef = useRef("");
  const assistantFinalizedRef = useRef(false);

  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);
  useEffect(() => {
    verbatimRef.current = verbatim;
  }, [verbatim]);
  useEffect(() => {
    capturingRef.current = capturingVerbatim;
  }, [capturingVerbatim]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  useEffect(() => {
    fetch("/api/realtime/session")
      .then((r) => r.json())
      .then((d) => setVoiceReady(Boolean(d.voiceConfigured)))
      .catch(() => setVoiceReady(false));
  }, []);

  useEffect(() => {
    if (status !== "live") return;
    const t = setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 500);
    return () => clearInterval(t);
  }, [status]);

  const setMicEnabled = useCallback((enabled: boolean) => {
    mediaRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }, []);

  const pushLine = useCallback((role: ChatLine["role"], text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && last.text === trimmed) return prev;
      // Merge consecutive assistant fragments into one bubble
      if (role === "assistant" && last?.role === "assistant") {
        const merged = `${last.text}${last.text.endsWith(" ") || trimmed.startsWith(" ") ? "" : ""}${trimmed}`.replace(
          /\s+/g,
          " "
        );
        // Avoid repeating the same greeting many times
        if (last.text.includes(trimmed) || merged.length < last.text.length + 2) {
          return prev;
        }
        const copy = [...prev];
        copy[copy.length - 1] = { ...last, text: `${last.text} ${trimmed}`.replace(/\s+/g, " ").trim() };
        return copy;
      }
      return [...prev, { id: `${Date.now()}-${Math.random()}`, role, text: trimmed }];
    });
  }, []);

  const normalizeUtterance = useCallback((s: string) => {
    return s
      .trim()
      .toLowerCase()
      .replace(/[?.!,।]+$/g, "")
      .replace(/\s+/g, " ");
  }, []);

  const upsertAssistantLine = useCallback(
    (text: string, done: boolean) => {
      const trimmed = text.trim().replace(/\s+/g, " ");
      if (!trimmed) return;

      const norm = normalizeUtterance(trimmed);
      // Exact / near-duplicate of last finished bubble (e.g. dual transcript.done events)
      if (done && lastAssistantFinalRef.current) {
        const prev = lastAssistantFinalRef.current;
        if (norm === prev || prev.includes(norm) || norm.includes(prev)) {
          assistantFinalizedRef.current = true;
          assistantLineIdRef.current = null;
          assistantBufRef.current = "";
          return;
        }
      }
      // Already finalized this response turn
      if (done && assistantFinalizedRef.current && !assistantLineIdRef.current) {
        return;
      }

      setLines((prev) => {
        // Prefer updating the open streaming bubble
        const id = assistantLineIdRef.current;
        if (id) {
          const idx = prev.findIndex((l) => l.id === id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], text: trimmed };
            return copy;
          }
        }
        // Or update last assistant if same turn (id lost) and not finalized
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !assistantFinalizedRef.current) {
          const lastNorm = normalizeUtterance(last.text);
          if (
            norm.startsWith(lastNorm) ||
            lastNorm.startsWith(norm) ||
            last.text === trimmed
          ) {
            const copy = [...prev];
            copy[copy.length - 1] = {
              ...last,
              text: trimmed.length >= last.text.length ? trimmed : last.text,
            };
            assistantLineIdRef.current = last.id;
            return copy;
          }
          // Near-duplicate of last finished message
          if (lastNorm === norm || lastNorm.includes(norm) || norm.includes(lastNorm)) {
            return prev;
          }
        }

        const newId = `asst-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        assistantLineIdRef.current = newId;
        return [...prev, { id: newId, role: "assistant", text: trimmed }];
      });

      if (done) {
        lastAssistantFinalRef.current = norm;
        assistantFinalizedRef.current = true;
        assistantLineIdRef.current = null;
        assistantBufRef.current = "";
      }
    },
    [normalizeUtterance]
  );

  const appendUserSpeech = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      // Ignore while agent is talking or just finished (echo of agent audio into mic)
      if (agentSpeakingRef.current) return;
      if (Date.now() < muteUntilRef.current) return;
      if (!isLikelyUserSpeech(t)) return;
      // Dedupe exact repeats from VAD double-fire
      if (lastUserTextRef.current === t) return;
      lastUserTextRef.current = t;

      userChunksRef.current.push(t);
      pushLine("user", t);
      if (capturingRef.current) {
        setVerbatim((prev) => {
          const next = prev ? `${prev} ${t}`.trim() : t;
          verbatimRef.current = next;
          return next;
        });
      }
    },
    [pushLine]
  );

  const cleanup = useCallback(() => {
    try {
      dcRef.current?.close();
    } catch {
      /* ignore */
    }
    try {
      pcRef.current?.getSenders().forEach((s) => s.track?.stop());
      pcRef.current?.close();
    } catch {
      /* ignore */
    }
    mediaRef.current?.getTracks().forEach((t) => t.stop());
    dcRef.current = null;
    pcRef.current = null;
    mediaRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  async function createDraftFromState(extraNote?: string) {
    setStatus("finalizing");
    const f = fieldsRef.current;
    let account = verbatimRef.current.trim();
    if (!account) account = userChunksRef.current.join(" ").trim();
    if (!account) account = extraNote?.trim() || "";

    const name = f.complainantName?.trim();
    if (!name) {
      setError("मसौदा बनाने से पहले कृपया अपना पूरा नाम बताएँ।");
      setStatus("live");
      return;
    }
    if (!account || account.length < 8) {
      setError("कृपया घटना का बयान दें। मसौदे के लिए तथ्यों का कथन आवश्यक है।");
      setStatus("live");
      return;
    }

    try {
      const body: ComplaintInput = {
        complainantName: name,
        complainantPhone: f.complainantPhone,
        complainantAddress: f.complainantAddress,
        parentage: f.parentage,
        age: f.age,
        gender: f.gender,
        occurrenceDate: f.occurrenceDate,
        occurrenceTime: f.occurrenceTime,
        occurrencePlace: f.occurrencePlace,
        policeStation: f.policeStation,
        policeStationDistrict: f.policeStationDistrict,
        policeStationState: f.policeStationState,
        policeStationPhone: f.policeStationPhone,
        accused: f.accused,
        witnesses: f.witnesses,
        injuryOrLoss: f.injuryOrLoss,
        reliefSought: f.reliefSought,
        language: f.language || "hi",
        verbatimAccount: account,
      };

      const data = await withIndependenceDelay(async () => {
        const res = await fetch("/api/complaints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "मसौदा तैयार नहीं हो सका");
        return json;
      });

      cleanup();
      setStatus("ended");
      router.push(data.reviewPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : "मसौदा तैयार नहीं हो सका");
      setStatus("error");
    }
  }

  function sendFunctionOutput(callId: string, output: unknown) {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    dc.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: callId,
          output: JSON.stringify(output),
        },
      })
    );
    dc.send(JSON.stringify({ type: "response.create" }));
  }

  async function handleToolCall(name: string, argsJson: string, callId: string) {
    let args: Record<string, unknown> = {};
    try {
      args = argsJson ? JSON.parse(argsJson) : {};
    } catch {
      args = {};
    }

    if (name === "save_field") {
      const field = String(args.field || "") as FieldKey;
      const value = String(args.value || "").trim();
      if (field && value) {
        setFields((prev) => {
          const next = { ...prev, [field]: value };
          fieldsRef.current = next;
          return next;
        });
      }
      sendFunctionOutput(callId, { ok: true, field, value });
      return;
    }

    if (name === "start_verbatim_segment") {
      setCapturingVerbatim(true);
      capturingRef.current = true;
      sendFunctionOutput(callId, { ok: true, capturing: true });
      pushLine("system", "आपका बयान आपके शब्दों में दर्ज हो रहा है…");
      return;
    }

    if (name === "end_verbatim_segment") {
      setCapturingVerbatim(false);
      capturingRef.current = false;
      const exact = String(args.exact_words || "").trim();
      if (exact) {
        setVerbatim(exact);
        verbatimRef.current = exact;
      }
      sendFunctionOutput(callId, {
        ok: true,
        capturing: false,
        chars: (exact || verbatimRef.current).length,
      });
      pushLine("system", "बयान खंड सुरक्षित।");
      return;
    }

    if (name === "finalize_intake") {
      sendFunctionOutput(callId, { ok: true, generating: true });
      pushLine("system", "प्रिंट योग्य शिकायत मसौदा तैयार हो रहा है…");
      await createDraftFromState(String(args.notes || ""));
      return;
    }

    sendFunctionOutput(callId, { ok: false, error: "unknown tool" });
  }

  function onDataMessage(raw: string) {
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }
    const type = String(event.type || "");

    // ——— Agent speaking: mute mic to kill speaker→mic echo loop ———
    if (type === "response.created") {
      agentSpeakingRef.current = true;
      setMicEnabled(false);
      // New model turn — reset stream state so we don't merge with previous bubble wrongly
      assistantBufRef.current = "";
      assistantLineIdRef.current = null;
      assistantFinalizedRef.current = false;
    }

    if (
      type === "response.output_audio.delta" ||
      type === "output_audio_buffer.started" ||
      type === "response.audio.delta"
    ) {
      if (!agentSpeakingRef.current) {
        agentSpeakingRef.current = true;
        setMicEnabled(false);
      }
    }

    if (
      type === "response.done" ||
      type === "response.completed" ||
      type === "output_audio_buffer.stopped"
    ) {
      // Finalize once from buffer if we only had deltas (no done transcript yet)
      if (!assistantFinalizedRef.current && assistantBufRef.current.trim()) {
        upsertAssistantLine(assistantBufRef.current, true);
      }
      agentSpeakingRef.current = false;
      muteUntilRef.current = Date.now() + 900;
      setTimeout(() => {
        if (!agentSpeakingRef.current) {
          setMicEnabled(true);
        }
      }, 900);
    }

    if (
      type === "conversation.item.input_audio_transcription.completed" ||
      type === "conversation.item.input_audio_transcription.done"
    ) {
      const transcript =
        (event.transcript as string) ||
        ((event.item as { transcript?: string })?.transcript ?? "");
      if (transcript) appendUserSpeech(transcript);
      return;
    }

    // Prefer a single transcript event family (output_audio_transcript).
    // Ignore legacy response.audio_transcript.* to avoid double bubbles.
    if (type === "response.output_audio_transcript.delta") {
      const delta = String(event.delta || "");
      if (delta && !assistantFinalizedRef.current) {
        assistantBufRef.current += delta;
        upsertAssistantLine(assistantBufRef.current, false);
      }
      return;
    }

    if (
      type === "response.output_audio_transcript.done" ||
      type === "response.output_audio_transcript.completed"
    ) {
      if (assistantFinalizedRef.current) return;
      const transcript = (event.transcript as string) || assistantBufRef.current;
      if (transcript) upsertAssistantLine(transcript, true);
      return;
    }

    // Fallback only if output_audio_transcript never fires on this connection
    if (type === "response.audio_transcript.delta") {
      if (assistantFinalizedRef.current) return;
      // Skip if we already received output_audio stream for this turn
      if (assistantBufRef.current && assistantLineIdRef.current) return;
      const delta = String(event.delta || "");
      if (delta) {
        assistantBufRef.current += delta;
        upsertAssistantLine(assistantBufRef.current, false);
      }
      return;
    }

    if (type === "response.audio_transcript.done") {
      if (assistantFinalizedRef.current) return;
      const transcript = (event.transcript as string) || assistantBufRef.current;
      if (transcript) upsertAssistantLine(transcript, true);
      return;
    }

    if (type === "response.function_call_arguments.done") {
      void handleToolCall(
        String(event.name || ""),
        String(event.arguments || "{}"),
        String(event.call_id || event.callId || "")
      );
      return;
    }

    if (type === "response.output_item.done") {
      const item = event.item as {
        type?: string;
        name?: string;
        arguments?: string;
        call_id?: string;
      } | undefined;
      if (item?.type === "function_call" && item.name) {
        void handleToolCall(item.name, item.arguments || "{}", item.call_id || "");
      }
      return;
    }

    if (type === "error") {
      const msg =
        (event.error as { message?: string })?.message ||
        (event.message as string) ||
        "Voice session error";
      // Don't hard-fail the whole session on benign recoverable errors
      if (/cancel|interrupt|already/i.test(msg)) return;
      setError(msg);
    }
  }

  async function startVoice() {
    setError(null);
    setStatus("connecting");
    setLines([]);
    setFields(emptyFields());
    setVerbatim("");
    userChunksRef.current = [];
    fieldsRef.current = {};
    verbatimRef.current = "";
    capturingRef.current = false;
    setCapturingVerbatim(false);
    agentSpeakingRef.current = false;
    muteUntilRef.current = 0;
    assistantBufRef.current = "";
    assistantLineIdRef.current = null;
    lastUserTextRef.current = "";
    lastAssistantFinalRef.current = "";
    assistantFinalizedRef.current = false;

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "failed" || state === "disconnected") {
          setError("आवाज़ कनेक्शन टूट गया। पुनः «बोलना शुरू करें» दबाएँ।");
          setStatus("error");
          cleanup();
        }
      };

      if (!audioRef.current) {
        audioRef.current = document.createElement("audio");
        audioRef.current.autoplay = true;
        // Keep agent audio playing even if tab is backgrounded briefly
        audioRef.current.setAttribute("playsinline", "true");
      }
      pc.ontrack = (e) => {
        if (audioRef.current) {
          audioRef.current.srcObject = e.streams[0];
          void audioRef.current.play().catch(() => undefined);
        }
      };

      // Close-talking mic: suppress room noise, prefer user's voice near the mic
      const audioConstraints: MediaTrackConstraints & Record<string, unknown> = {
        echoCancellation: { ideal: true },
        noiseSuppression: { ideal: true },
        autoGainControl: { ideal: true },
        channelCount: { ideal: 1 },
        // Chrome advanced constraints (ignored if unsupported)
        googEchoCancellation: true,
        googNoiseSuppression: true,
        googHighpassFilter: true,
        googAutoGainControl: true,
      };
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints as MediaTrackConstraints,
      });
      mediaRef.current = ms;

      // Prefer the first audio track only; keep enabled for whole session
      const track = ms.getAudioTracks()[0];
      if (track) {
        track.enabled = true;
        try {
          await track.applyConstraints({
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          });
        } catch {
          /* constraints already set */
        }
        pc.addTrack(track, ms);
      } else {
        ms.getTracks().forEach((t) => pc.addTrack(t, ms));
      }

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;
      dc.addEventListener("message", (e) => onDataMessage(String(e.data)));
      dc.addEventListener("open", () => {
        // Session audio already configured server-side — avoid session.update
        // (can spawn an extra model turn / duplicate speech).
        // One greeting only.
        dc.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions:
                "Ek hi short Hindi greeting: Namaste, main aapka draft complaint banaunga. Sirf poora naam poochho. Dobara greeting mat do, same baat do baar mat bolo. Extra sawal mat poochho abhi.",
            },
          })
        );
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait briefly for ICE gathering so SDP is more complete (fewer mid-call drops)
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
          return;
        }
        const t = setTimeout(() => resolve(), 1500);
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === "complete") {
            clearTimeout(t);
            resolve();
          }
        };
      });

      const sdpResponse = await fetch("/api/realtime/session", {
        method: "POST",
        body: pc.localDescription?.sdp || offer.sdp || "",
        headers: { "Content-Type": "application/sdp" },
      });

      if (!sdpResponse.ok) {
        let detail = await sdpResponse.text();
        try {
          const j = JSON.parse(detail);
          detail = j.detail || j.error || detail;
        } catch {
          /* keep */
        }
        throw new Error(
          voiceReady === false
            ? "आवाज़ सेवा अस्थायी रूप से अनुपलब्ध है। कृपया लिखित आवेदन उपयोग करें।"
            : detail || "आवाज़ सत्र शुरू नहीं हो सका"
        );
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

      startedAtRef.current = Date.now();
      setElapsed(0);
      setStatus("live");
      pushLine(
        "system",
        "सुरक्षित चैनल स्थापित। अधिकारी के बोलने के बाद विवरण दें। हेडफ़ोन उपयोग अनुशंसित।"
      );
    } catch (e) {
      cleanup();
      setStatus("error");
      const msg = e instanceof Error ? e.message : "आवाज़ सत्र शुरू नहीं हो सका";
      setError(
        msg.includes("OPENAI") || msg.includes("API key")
          ? "आवाज़ सेवा अस्थायी रूप से अनुपलब्ध है। कृपया लिखित आवेदन उपयोग करें।"
          : msg
      );
    }
  }

  function stopVoice() {
    cleanup();
    setStatus("ended");
    pushLine("system", "सत्र समाप्त।");
  }

  const filledCount = Object.values(fields).filter((v) => String(v || "").trim()).length;
  const isLive = status === "live" || status === "connecting" || status === "finalizing";

  return (
    <div className="space-y-5">
      <IndependenceLoader
        open={status === "finalizing"}
        message="आपकी शिकायत का मसौदा तैयार किया जा रहा है"
      />

      <div className="rounded-2xl border-2 border-[var(--gold)]/50 bg-gradient-to-r from-[#fff9e8] via-white to-[#f0f5ff] px-4 py-5 shadow-md sm:px-6 sm:py-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 ${
                status === "live"
                  ? "border-red-500 bg-red-50"
                  : "border-[var(--gold)] bg-white"
              }`}
            >
              <span
                className={`h-3.5 w-3.5 rounded-full ${
                  status === "live"
                    ? "live-pulse bg-red-500"
                    : status === "connecting" || status === "finalizing"
                      ? "animate-pulse bg-amber-500"
                      : "bg-[var(--navy)]/30"
                }`}
              />
            </div>
            <div>
              <p className="text-base font-bold text-[var(--navy)] sm:text-lg">
                {status === "idle" && "मौखिक बयान — तैयार"}
                {status === "connecting" && "सुरक्षित चैनल… माइक्रोफ़ोन की अनुमति दें"}
                {status === "live" && "रिकॉर्डिंग जारी — स्पष्ट बोलें"}
                {status === "finalizing" && "शिकायत मसौदा तैयार हो रहा है…"}
                {status === "ended" && "सत्र बंद"}
                {status === "error" && "सत्र जारी नहीं रह सका"}
              </p>
              <p className="text-xs text-slate-500 sm:text-sm">
                {status === "live"
                  ? `समय ${formatTime(elapsed)}${capturingVerbatim ? " · तथ्यों का कथन दर्ज" : ""}`
                  : "आधिकारिक प्रविष्टि · हिंदी / अंग्रेज़ी · थाने हेतु"}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
            {!isLive ? (
              <button
                type="button"
                onClick={() => void startVoice()}
                className="btn-start-speak w-full sm:w-auto"
              >
                <span className="mic-dot" aria-hidden />
                बोलना शुरू करें
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={stopVoice}
                  className="btn-ghost rounded-lg px-4 py-2.5 text-sm"
                  disabled={status === "finalizing"}
                >
                  सत्र समाप्त
                </button>
                <button
                  type="button"
                  onClick={() => void createDraftFromState()}
                  disabled={status === "finalizing" || status === "connecting"}
                  className="btn-primary rounded-lg px-4 py-2.5 text-sm"
                >
                  {status === "finalizing" ? "तैयार हो रहा है…" : "शिकायत मसौदा बनाएँ"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="section-title text-sm">बयान संवाद</h4>
            <span className="text-xs text-slate-500">डेस्क अधिकारी · शिकायतकर्ता</span>
          </div>
          <div className="flex h-[22rem] flex-col rounded-xl border border-[var(--line)] bg-[#f8fafc] shadow-inner">
            <div className="flex-1 space-y-2.5 overflow-y-auto p-3 sm:p-4">
              {lines.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-slate-500">
                  <p className="font-semibold text-[var(--navy)]">अभी कोई बयान नहीं</p>
                  <p className="mt-1 max-w-sm text-slate-600">
                    <strong>बोलना शुरू करें</strong> दबाएँ, माइक्रोफ़ोन की अनुमति दें, और ड्यूटी
                    अधिकारी के सामने जैसा बयान दें वैसा बताएँ।
                  </p>
                </div>
              )}
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                    line.role === "user"
                      ? "ml-auto border border-[var(--line)] bg-white text-slate-900"
                      : line.role === "assistant"
                        ? "mr-auto bg-[var(--navy)] text-white"
                        : "mx-auto max-w-full bg-[var(--gold-soft)] text-center text-xs font-medium text-[#5c4a12]"
                  }`}
                >
                  {line.role !== "system" && (
                    <div
                      className={`mb-0.5 text-[10px] font-bold tracking-wide ${
                        line.role === "assistant" ? "text-[var(--gold-bright)]" : "text-slate-400"
                      }`}
                    >
                      {line.role === "assistant" ? "डेस्क अधिकारी" : "शिकायतकर्ता"}
                    </div>
                  )}
                  {line.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="section-title text-sm">शिकायतकर्ता विवरण</h4>
              <span className="rounded bg-[var(--navy)] px-2 py-0.5 text-[10px] font-bold text-white">
                {filledCount} भरे
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md border border-[#c5cedd] bg-white">
              <table className="w-full text-sm">
                <tbody>
                  {Object.keys(FIELD_LABELS).map((key) => {
                    const val = fields[key as FieldKey];
                    if (!val) return null;
                    return (
                      <tr key={key} className="border-b border-slate-100">
                        <th className="w-[42%] bg-[#f3f6fb] px-3 py-2 text-left text-xs font-semibold text-slate-600">
                          {FIELD_LABELS[key]}
                        </th>
                        <td className="px-3 py-2 text-slate-900">{String(val)}</td>
                      </tr>
                    );
                  })}
                  {filledCount === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-xs text-slate-500">
                        बोलते ही विवरण यहाँ दिखेंगे
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="section-title mb-2 text-sm">तथ्यों का कथन (यथावत)</h4>
            <div className="min-h-[8rem] max-h-40 overflow-y-auto rounded-xl border-2 border-[var(--navy)] bg-gradient-to-br from-[#071a3a] to-[#0c2a5c] p-3.5">
              <p className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-[var(--gold-soft)]">
                {verbatim ||
                  "शिकायतकर्ता का घटना-बयान यहाँ बिना बदलाव के दर्ज होगा।"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
