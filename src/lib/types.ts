export type OffenceEntry = {
  id: string;
  plain_name_en: string;
  plain_name_hi: string;
  bns_sections: string[];
  keywords: string[];
  elements: string[];
  severity_note: string;
};

export type OffenceSuggestion = {
  offenceId: string;
  nameEn: string;
  nameHi: string;
  bnsSections: string[];
  confidence: number;
  rationale: string;
  evidenceQuotes: string[];
  severityNote: string;
};

export type ComplaintInput = {
  complainantName: string;
  complainantPhone?: string;
  complainantAddress?: string;
  parentage?: string;
  age?: string;
  gender?: string;
  occurrenceDate?: string;
  occurrenceTime?: string;
  occurrencePlace?: string;
  /** Jurisdictional police station / thana */
  policeStation?: string;
  policeStationDistrict?: string;
  policeStationState?: string;
  policeStationPhone?: string;
  accused?: string;
  witnesses?: string;
  injuryOrLoss?: string;
  reliefSought?: string;
  /** Exact citizen words — never paraphrased in storage */
  verbatimAccount: string;
  language?: string;
};

export type ComplaintRecord = ComplaintInput & {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  formalSummary: string;
  offence: OffenceSuggestion;
  status: "draft" | "ready";
  storageBackend: "supabase" | "local";
};

export type ComplaintRow = {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
  complainant_name: string;
  complainant_phone: string | null;
  complainant_address: string | null;
  parentage: string | null;
  age: string | null;
  gender: string | null;
  occurrence_date: string | null;
  occurrence_time: string | null;
  occurrence_place: string | null;
  police_station: string | null;
  police_station_district: string | null;
  police_station_state: string | null;
  police_station_phone: string | null;
  accused: string | null;
  witnesses: string | null;
  injury_or_loss: string | null;
  relief_sought: string | null;
  verbatim_account: string;
  formal_summary: string | null;
  offence_id: string | null;
  offence_name_en: string | null;
  offence_name_hi: string | null;
  bns_sections: string[] | null;
  offence_confidence: number | null;
  offence_rationale: string | null;
  evidence_quotes: string[] | null;
  language: string | null;
  status: string;
  storage_backend: string | null;
};
