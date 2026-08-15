import { NextResponse } from "next/server";
import { getStorageMode } from "@/lib/store";
import { BNS_OFFENCES } from "@/lib/bns-catalogue";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "police-complaint-voice",
    storage: getStorageMode(),
    offenceCatalogueSize: BNS_OFFENCES.length,
    openaiRealtime: Boolean(process.env.OPENAI_API_KEY?.trim()),
    realtimeModel: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime",
  });
}
