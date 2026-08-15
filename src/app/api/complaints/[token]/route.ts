import { NextResponse } from "next/server";
import { getComplaintByToken, updateStructuredFields } from "@/lib/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;
    const record = await getComplaintByToken(token);
    if (!record) {
      return NextResponse.json({ error: "Not found or expired" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, complaint: record });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load complaint";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;
    const body = await req.json();
    // Never accept verbatimAccount updates via this route.
    const {
      complainantName,
      complainantPhone,
      complainantAddress,
      parentage,
      age,
      gender,
      occurrenceDate,
      occurrenceTime,
      occurrencePlace,
      policeStation,
      policeStationDistrict,
      policeStationState,
      policeStationPhone,
      accused,
      witnesses,
      injuryOrLoss,
      reliefSought,
    } = body ?? {};

    const record = await updateStructuredFields(token, {
      complainantName,
      complainantPhone,
      complainantAddress,
      parentage,
      age,
      gender,
      occurrenceDate,
      occurrenceTime,
      occurrencePlace,
      policeStation,
      policeStationDistrict,
      policeStationState,
      policeStationPhone,
      accused,
      witnesses,
      injuryOrLoss,
      reliefSought,
    });
    if (!record) {
      return NextResponse.json({ error: "Not found or expired" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, complaint: record });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update complaint";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
