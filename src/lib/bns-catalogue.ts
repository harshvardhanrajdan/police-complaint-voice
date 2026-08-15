import catalogue from "../../data/bns_offences.v1.json";
import type { OffenceEntry } from "./types";

export const BNS_OFFENCES = catalogue as OffenceEntry[];

export function getOffenceById(id: string): OffenceEntry | undefined {
  return BNS_OFFENCES.find((o) => o.id === id);
}
