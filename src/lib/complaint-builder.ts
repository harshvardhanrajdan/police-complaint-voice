import { mapOffence } from "./offence-mapper";
import type { ComplaintInput, ComplaintRecord, OffenceSuggestion } from "./types";
import { randomBytes } from "crypto";

export function preserveVerbatim(account: string): string {
  // Exact account preservation: no paraphrase, only normalize line endings.
  return account.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function buildFormalSummary(
  input: ComplaintInput,
  offence: OffenceSuggestion
): string {
  const name = input.complainantName.trim();
  const place = input.occurrencePlace?.trim() || "the place stated by the complainant";
  const when = [input.occurrenceDate, input.occurrenceTime].filter(Boolean).join(" at ") ||
    "the date and time stated by the complainant";
  const sections =
    offence.bnsSections.length > 0
      ? `suggested under BNS Section(s) ${offence.bnsSections.join(", ")}`
      : "with offence classification to be decided by the station";

  const station = input.policeStation?.trim();
  const stationLine = station
    ? `I request that this matter be taken up by Police Station ${station}${
        input.policeStationDistrict?.trim()
          ? `, District ${input.policeStationDistrict.trim()}`
          : ""
      }${input.policeStationState?.trim() ? `, ${input.policeStationState.trim()}` : ""}.`
    : "I request that the jurisdictional police station take cognizance as per law.";

  return [
    `I, ${name}, most respectfully submit this draft complaint regarding an incident that occurred at ${place} on ${when}.`,
    `The facts of the case as stated by me are recorded below under “Facts as stated by the complainant”.`,
    `On the basis of the said facts, the provisional offence / धारा indicated is "${offence.nameEn}" (${offence.nameHi}), ${sections}.`,
    input.accused?.trim()
      ? `Accused named / described: ${input.accused.trim()}.`
      : "The accused is unknown or not fully identified at this stage.",
    input.injuryOrLoss?.trim()
      ? `Injury / loss reported: ${input.injuryOrLoss.trim()}.`
      : null,
    stationLine,
    input.reliefSought?.trim()
      ? `Prayer: ${input.reliefSought.trim()}.`
      : "Prayer: that the police may be pleased to register the appropriate case, investigate, and take lawful action.",
    "This is a draft for station presentation only and does not itself amount to registration of an FIR.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function newToken(): string {
  return randomBytes(12).toString("base64url");
}

export function buildComplaintRecord(
  input: ComplaintInput,
  opts?: { id?: string; token?: string; storageBackend?: "supabase" | "local" }
): ComplaintRecord {
  const verbatimAccount = preserveVerbatim(input.verbatimAccount);
  if (!input.complainantName?.trim()) {
    throw new Error("Complainant name is required");
  }
  if (!verbatimAccount.trim()) {
    throw new Error("Incident account (exact words) is required");
  }

  const offence = mapOffence(verbatimAccount);
  const formalSummary = buildFormalSummary({ ...input, verbatimAccount }, offence);
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    id: opts?.id ?? crypto.randomUUID(),
    token: opts?.token ?? newToken(),
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    complainantName: input.complainantName.trim(),
    complainantPhone: input.complainantPhone?.trim() || undefined,
    complainantAddress: input.complainantAddress?.trim() || undefined,
    parentage: input.parentage?.trim() || undefined,
    age: input.age?.trim() || undefined,
    gender: input.gender?.trim() || undefined,
    occurrenceDate: input.occurrenceDate?.trim() || undefined,
    occurrenceTime: input.occurrenceTime?.trim() || undefined,
    occurrencePlace: input.occurrencePlace?.trim() || undefined,
    policeStation: input.policeStation?.trim() || undefined,
    policeStationDistrict: input.policeStationDistrict?.trim() || undefined,
    policeStationState: input.policeStationState?.trim() || undefined,
    policeStationPhone: input.policeStationPhone?.trim() || undefined,
    accused: input.accused?.trim() || undefined,
    witnesses: input.witnesses?.trim() || undefined,
    injuryOrLoss: input.injuryOrLoss?.trim() || undefined,
    reliefSought: input.reliefSought?.trim() || undefined,
    verbatimAccount,
    language: input.language || "en",
    formalSummary,
    offence,
    status: "ready",
    storageBackend: opts?.storageBackend ?? "local",
  };
}
