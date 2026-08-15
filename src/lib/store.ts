import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import type { ComplaintRecord, ComplaintRow } from "./types";
import { buildComplaintRecord } from "./complaint-builder";
import type { ComplaintInput } from "./types";

const localFile = path.join(process.cwd(), ".data", "complaints.json");

type GlobalStore = { complaints: Map<string, ComplaintRecord> };
function memoryStore(): GlobalStore {
  const g = globalThis as typeof globalThis & { __complaintStore?: GlobalStore };
  if (!g.__complaintStore) g.__complaintStore = { complaints: new Map() };
  return g.__complaintStore;
}

function hasSupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function rowToRecord(row: ComplaintRow): ComplaintRecord {
  return {
    id: row.id,
    token: row.token,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    complainantName: row.complainant_name,
    complainantPhone: row.complainant_phone || undefined,
    complainantAddress: row.complainant_address || undefined,
    parentage: row.parentage || undefined,
    age: row.age || undefined,
    gender: row.gender || undefined,
    occurrenceDate: row.occurrence_date || undefined,
    occurrenceTime: row.occurrence_time || undefined,
    occurrencePlace: row.occurrence_place || undefined,
    policeStation: row.police_station || undefined,
    policeStationDistrict: row.police_station_district || undefined,
    policeStationState: row.police_station_state || undefined,
    policeStationPhone: row.police_station_phone || undefined,
    accused: row.accused || undefined,
    witnesses: row.witnesses || undefined,
    injuryOrLoss: row.injury_or_loss || undefined,
    reliefSought: row.relief_sought || undefined,
    verbatimAccount: row.verbatim_account,
    formalSummary: row.formal_summary || "",
    language: row.language || "en",
    status: (row.status as "draft" | "ready") || "ready",
    storageBackend: (row.storage_backend as "supabase" | "local") || "supabase",
    offence: {
      offenceId: row.offence_id || "unknown_other",
      nameEn: row.offence_name_en || "Unclassified",
      nameHi: row.offence_name_hi || "अवर्गीकृत",
      bnsSections: row.bns_sections || [],
      confidence: row.offence_confidence ?? 0,
      rationale: row.offence_rationale || "",
      evidenceQuotes: row.evidence_quotes || [],
      severityNote: "",
    },
  };
}

function recordToRow(r: ComplaintRecord): Omit<ComplaintRow, "id"> & { id?: string } {
  return {
    id: r.id,
    token: r.token,
    created_at: r.createdAt,
    expires_at: r.expiresAt,
    complainant_name: r.complainantName,
    complainant_phone: r.complainantPhone ?? null,
    complainant_address: r.complainantAddress ?? null,
    parentage: r.parentage ?? null,
    age: r.age ?? null,
    gender: r.gender ?? null,
    occurrence_date: r.occurrenceDate ?? null,
    occurrence_time: r.occurrenceTime ?? null,
    occurrence_place: r.occurrencePlace ?? null,
    police_station: r.policeStation ?? null,
    police_station_district: r.policeStationDistrict ?? null,
    police_station_state: r.policeStationState ?? null,
    police_station_phone: r.policeStationPhone ?? null,
    accused: r.accused ?? null,
    witnesses: r.witnesses ?? null,
    injury_or_loss: r.injuryOrLoss ?? null,
    relief_sought: r.reliefSought ?? null,
    verbatim_account: r.verbatimAccount,
    formal_summary: r.formalSummary,
    offence_id: r.offence.offenceId,
    offence_name_en: r.offence.nameEn,
    offence_name_hi: r.offence.nameHi,
    bns_sections: r.offence.bnsSections,
    offence_confidence: r.offence.confidence,
    offence_rationale: r.offence.rationale,
    evidence_quotes: r.offence.evidenceQuotes,
    language: r.language || "en",
    status: r.status,
    storage_backend: r.storageBackend,
  };
}

async function readLocal(): Promise<ComplaintRecord[]> {
  const mem = Array.from(memoryStore().complaints.values());
  if (mem.length > 0) {
    return mem.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  try {
    const raw = await fs.readFile(localFile, "utf8");
    const rows = JSON.parse(raw) as ComplaintRecord[];
    for (const r of rows) memoryStore().complaints.set(r.token, r);
    return rows;
  } catch {
    return [];
  }
}

async function writeLocal(records: ComplaintRecord[]): Promise<void> {
  const store = memoryStore();
  store.complaints.clear();
  for (const r of records) store.complaints.set(r.token, r);
  try {
    await fs.mkdir(path.dirname(localFile), { recursive: true });
    await fs.writeFile(localFile, JSON.stringify(records, null, 2), "utf8");
  } catch {
    // Serverless filesystems may be read-only; memory still works for warm instances.
  }
}

export function getStorageMode(): "supabase" | "local" {
  return hasSupabase() ? "supabase" : "local";
}

export async function createComplaint(input: ComplaintInput): Promise<ComplaintRecord> {
  if (hasSupabase()) {
    const record = buildComplaintRecord(input, { storageBackend: "supabase" });
    const supabase = getSupabase();
    const row = recordToRow(record);
    const { data, error } = await supabase
      .from("complaints")
      .insert(row)
      .select("*")
      .single();
    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }
    return rowToRecord(data as ComplaintRow);
  }

  const record = buildComplaintRecord(input, { storageBackend: "local" });
  const all = await readLocal();
  all.unshift(record);
  await writeLocal(all);
  return record;
}

export async function getComplaintByToken(token: string): Promise<ComplaintRecord | null> {
  if (hasSupabase()) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("token", token)
      .maybeSingle();
    if (error) {
      throw new Error(`Supabase read failed: ${error.message}`);
    }
    if (!data) return null;
    const record = rowToRecord(data as ComplaintRow);
    if (new Date(record.expiresAt) < new Date()) return null;
    return record;
  }

  const all = await readLocal();
  const found = all.find((r) => r.token === token) || null;
  if (!found) return null;
  if (new Date(found.expiresAt) < new Date()) return null;
  return found;
}

export async function updateStructuredFields(
  token: string,
  patch: Partial<
    Pick<
      ComplaintInput,
      | "complainantName"
      | "complainantPhone"
      | "complainantAddress"
      | "occurrenceDate"
      | "occurrenceTime"
      | "occurrencePlace"
      | "policeStation"
      | "policeStationDistrict"
      | "policeStationState"
      | "policeStationPhone"
      | "accused"
      | "witnesses"
      | "injuryOrLoss"
      | "reliefSought"
      | "parentage"
      | "age"
      | "gender"
    >
  >
): Promise<ComplaintRecord | null> {
  const existing = await getComplaintByToken(token);
  if (!existing) return null;

  // Verbatim is never updated here — exact account preservation.
  const merged: ComplaintInput = {
    complainantName: patch.complainantName ?? existing.complainantName,
    complainantPhone: patch.complainantPhone ?? existing.complainantPhone,
    complainantAddress: patch.complainantAddress ?? existing.complainantAddress,
    parentage: patch.parentage ?? existing.parentage,
    age: patch.age ?? existing.age,
    gender: patch.gender ?? existing.gender,
    occurrenceDate: patch.occurrenceDate ?? existing.occurrenceDate,
    occurrenceTime: patch.occurrenceTime ?? existing.occurrenceTime,
    occurrencePlace: patch.occurrencePlace ?? existing.occurrencePlace,
    policeStation: patch.policeStation ?? existing.policeStation,
    policeStationDistrict: patch.policeStationDistrict ?? existing.policeStationDistrict,
    policeStationState: patch.policeStationState ?? existing.policeStationState,
    policeStationPhone: patch.policeStationPhone ?? existing.policeStationPhone,
    accused: patch.accused ?? existing.accused,
    witnesses: patch.witnesses ?? existing.witnesses,
    injuryOrLoss: patch.injuryOrLoss ?? existing.injuryOrLoss,
    reliefSought: patch.reliefSought ?? existing.reliefSought,
    verbatimAccount: existing.verbatimAccount,
    language: existing.language,
  };

  const rebuilt = buildComplaintRecord(merged, {
    id: existing.id,
    token: existing.token,
    storageBackend: existing.storageBackend,
  });
  rebuilt.createdAt = existing.createdAt;
  rebuilt.expiresAt = existing.expiresAt;

  if (hasSupabase()) {
    const supabase = getSupabase();
    const row = recordToRow(rebuilt);
    const { id: _id, token: _t, created_at: _c, ...update } = row as ComplaintRow;
    const { data, error } = await supabase
      .from("complaints")
      .update(update)
      .eq("token", token)
      .select("*")
      .single();
    if (error) throw new Error(`Supabase update failed: ${error.message}`);
    return rowToRecord(data as ComplaintRow);
  }

  const all = await readLocal();
  const idx = all.findIndex((r) => r.token === token);
  if (idx < 0) return null;
  all[idx] = rebuilt;
  await writeLocal(all);
  return rebuilt;
}
