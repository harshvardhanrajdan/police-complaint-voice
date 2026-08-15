import { NextResponse } from "next/server";
import { INTAKE_INSTRUCTIONS, REALTIME_TOOLS } from "@/lib/intake-prompt";

export const runtime = "nodejs";

const DEFAULT_MODEL = process.env.OPENAI_REALTIME_MODEL || "gpt-realtime";
/** Prefer a warm voice that works well with Hindi / Indian English delivery */
const DEFAULT_VOICE = process.env.OPENAI_REALTIME_VOICE || "coral";

function getOpenAIKey(): string | null {
  return process.env.OPENAI_API_KEY?.trim() || null;
}

/**
 * Session tuned so:
 * - Agent does not cut off mid-sentence on short pauses (longer silence)
 * - Background noise is less likely to trigger turns (higher VAD threshold + noise reduction)
 */
export function sessionConfig() {
  return {
    type: "realtime",
    model: DEFAULT_MODEL,
    instructions: `${INTAKE_INSTRUCTIONS}

Conversation continuity:
- Never stop mid-question or mid-sentence. Finish every spoken reply fully.
- If the citizen pauses briefly while thinking, wait — do not interrupt or abandon the intake.
- Ignore background TV, traffic, other people, and random noise. Only react to clear speech from the main speaker.
- Do NOT restart the whole greeting repeatedly. If you already asked for the name, wait; re-ask once at most, then stay quiet until they answer.
- Keep the session going until finalize_intake or they say they are done.
- Ignore nonsense transcription / foreign noise phrases; ask them to repeat once clearly in Hindi or English.`,
    tools: REALTIME_TOOLS,
    tool_choice: "auto",
    audio: {
      input: {
        // Close-talking mic: focus on speaker near the device
        noise_reduction: {
          type: process.env.OPENAI_NOISE_REDUCTION || "near_field",
        },
        transcription: {
          model: process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
          // Do NOT force "hi" — forced Hindi mangles English/noise into garbage
          ...(process.env.OPENAI_TRANSCRIBE_LANGUAGE
            ? { language: process.env.OPENAI_TRANSCRIBE_LANGUAGE }
            : {}),
        },
        // Semantic VAD understands end-of-turn better than pure silence (fewer mid-cuts)
        turn_detection:
          process.env.OPENAI_VAD_MODE === "server"
            ? {
                type: "server_vad",
                threshold: Number(process.env.OPENAI_VAD_THRESHOLD || 0.85),
                prefix_padding_ms: Number(process.env.OPENAI_VAD_PREFIX_MS || 300),
                silence_duration_ms: Number(process.env.OPENAI_VAD_SILENCE_MS || 1600),
                create_response: true,
                interrupt_response: false,
              }
            : {
                type: "semantic_vad",
                // low = wait longer; less eager to jump on noise / short blips
                eagerness: process.env.OPENAI_VAD_EAGERNESS || "low",
                create_response: true,
                interrupt_response: false,
              },
      },
      output: {
        voice: DEFAULT_VOICE,
      },
    },
  };
}

/**
 * Unified WebRTC interface: browser POSTs local SDP offer as text/plain.
 * Server authenticates with OPENAI_API_KEY and returns remote SDP answer.
 * @see https://developers.openai.com/api/docs/guides/realtime-webrtc
 */
export async function POST(req: Request) {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is not set. Add it to .env.local to enable OpenAI Realtime voice.",
      },
      { status: 503 }
    );
  }

  const contentType = req.headers.get("content-type") || "";
  let sdp: string;

  if (contentType.includes("application/sdp") || contentType.includes("text/plain")) {
    sdp = await req.text();
  } else if (contentType.includes("application/json")) {
    const body = await req.json();
    sdp = body.sdp;
  } else {
    sdp = await req.text();
  }

  if (!sdp?.trim()) {
    return NextResponse.json({ error: "SDP offer required" }, { status: 400 });
  }

  try {
    const fd = new FormData();
    fd.set("sdp", sdp);
    fd.set("session", JSON.stringify(sessionConfig()));

    const r = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Safety-Identifier": "police-complaint-voice-demo",
      },
      body: fd,
    });

    const answerSdp = await r.text();
    if (!r.ok) {
      return NextResponse.json(
        {
          error: "OpenAI Realtime session failed",
          detail: answerSdp.slice(0, 800),
          status: r.status,
        },
        { status: 502 }
      );
    }

    return new NextResponse(answerSdp, {
      status: 200,
      headers: { "Content-Type": "application/sdp" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Realtime session error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Health / capability probe for the UI */
export async function GET() {
  const configured = Boolean(getOpenAIKey());
  return NextResponse.json({
    ok: true,
    voiceConfigured: configured,
    model: DEFAULT_MODEL,
    voice: DEFAULT_VOICE,
    transport: "webrtc-unified",
    vad: {
      threshold: Number(process.env.OPENAI_VAD_THRESHOLD || 0.78),
      silence_duration_ms: Number(process.env.OPENAI_VAD_SILENCE_MS || 1400),
      noise_reduction: process.env.OPENAI_NOISE_REDUCTION || "near_field",
    },
  });
}
