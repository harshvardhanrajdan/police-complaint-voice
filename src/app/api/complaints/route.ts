import { NextResponse } from "next/server";
import { createComplaint, getStorageMode } from "@/lib/store";
import type { ComplaintInput } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ComplaintInput;
    if (!body?.complainantName?.trim()) {
      return NextResponse.json({ error: "complainantName is required" }, { status: 400 });
    }
    if (!body?.verbatimAccount?.trim()) {
      return NextResponse.json(
        { error: "verbatimAccount (exact incident words) is required" },
        { status: 400 }
      );
    }

    const record = await createComplaint(body);
    return NextResponse.json({
      ok: true,
      storage: getStorageMode(),
      token: record.token,
      id: record.id,
      reviewPath: `/d/${record.token}`,
      offence: record.offence,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create complaint";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    storage: getStorageMode(),
    message: "POST a complaint body to create a draft. Review at /d/:token",
  });
}
