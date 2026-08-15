import type { ComplaintInput } from "./types";

export type CaptureField = keyof ComplaintInput;

const REQUIRED: CaptureField[] = ["complainantName", "verbatimAccount"];
const STRONGLY_PREFERRED: CaptureField[] = [
  "complainantPhone",
  "occurrencePlace",
];

export type MissingReport = {
  required: CaptureField[];
  preferred: CaptureField[];
  all: CaptureField[];
};

export function getMissingFields(
  fields: Partial<ComplaintInput>,
  verbatim: string
): MissingReport {
  const hasVerbatim = Boolean(verbatim?.trim() && verbatim.trim().length >= 8);
  const required = REQUIRED.filter((k) => {
    if (k === "verbatimAccount") return !hasVerbatim;
    return !String(fields[k] || "").trim();
  });
  const preferred = STRONGLY_PREFERRED.filter(
    (k) => !String(fields[k] || "").trim()
  );
  return { required, preferred, all: [...required, ...preferred] };
}

export function missingLabelsHi(keys: CaptureField[]): string {
  const map: Record<string, string> = {
    complainantName: "पूरा नाम",
    complainantPhone: "मोबाइल नंबर",
    occurrencePlace: "घटना का स्थान",
    occurrenceDate: "घटना की तिथि",
    occurrenceTime: "घटना का समय",
    policeStation: "थाने का नाम",
    accused: "अभियुक्त (यदि ज्ञात)",
    verbatimAccount: "घटना का पूरा बयान",
  };
  return keys.map((k) => map[k] || k).join(", ");
}

/** Infer which field the desk officer just asked for */
export function detectPromptedField(assistantText: string): CaptureField | null {
  const t = assistantText.toLowerCase();
  if (/mobile|phone|number|मोबाइल|फोन|नंबर|number bata|mobile number/.test(t)) {
    return "complainantPhone";
  }
  if (/thana|police station|थाना|स्टेशन/.test(t) && !/submit|jama|draft tayyar/.test(t)) {
    return "policeStation";
  }
  if (
    /jagah|sthan|place|स्थान|जगह|kahaan|kahan|location|paan shop|market/.test(t) &&
    !/ghatna ki tareekh|date only/.test(t)
  ) {
    // "jagah aur tareekh" — prefer place first
    if (/tareekh|date|तिथि|तारीख/.test(t) && /jagah|sthan|place|जगह|स्थान/.test(t)) {
      return "occurrencePlace";
    }
    if (/tareekh|date|तिथि|तारीख|samay|time|बजे/.test(t) && !/jagah|sthan|place/.test(t)) {
      if (/samay|time|बजे/.test(t)) return "occurrenceTime";
      return "occurrenceDate";
    }
    return "occurrencePlace";
  }
  if (/tareekh|date|तिथि|तारीख|march|januari|february|april|may|june|july|august|september|october|november|december/.test(t) && /bata|pooch|kya|when|kab/.test(t)) {
    return "occurrenceDate";
  }
  if (/\bnaam\b|name|नाम|naam bata|poora naam/.test(t) && !/accused|hamla|rohit/.test(t)) {
    return "complainantName";
  }
  if (/accused|hamla karne|kisne|kaun|नाम है/.test(t)) {
    return "accused";
  }
  return null;
}

/** Pull structured facts from a single user utterance */
export function extractFromUserUtterance(
  text: string,
  prompted: CaptureField | null
): Partial<ComplaintInput> {
  const out: Partial<ComplaintInput> = {};
  const t = text.trim();
  if (!t) return out;

  // Phone
  const phone = t.match(/(?:\+91[\s-]?)?([6-9]\d{9})\b/);
  if (phone) out.complainantPhone = phone[1];

  // Date patterns: 10 March, 10/03/2026, 10-03-2026
  const dateEn = t.match(
    /\b(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{2,4})?\b/i
  );
  const dateNum = t.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if (dateEn) {
    out.occurrenceDate = dateEn[0];
  } else if (dateNum) {
    out.occurrenceDate = dateNum[0];
  }

  // Time: 9 baje, 21:00, 9 pm
  const time = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(baje|pm|am|बजे)?\b/i);
  if (time && /baje|pm|am|बजे|raat|shaam|subah/i.test(t)) {
    out.occurrenceTime = time[0];
  }

  // Accused: "naam hai Rohit", "named Rohit", "ek ka naam hai Rohit"
  const accused =
    t.match(/(?:naam hai|named|name is|नाम है)\s+([A-Za-z\u0900-\u097F]{2,40})/i) ||
    t.match(/\b(rohit|ramesh|rahul|amit|priya)\b/i);
  if (accused) out.accused = accused[1];

  // Police station
  const thana = t.match(
    /([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{1,40}?)\s*(police\s*station|thana|थाना)/i
  );
  if (thana) out.policeStation = thana[0].trim();

  // If officer asked for a specific field, treat whole clean utterance as value
  if (prompted && prompted !== "verbatimAccount") {
    const cleaned = t.replace(/^(mera naam|my name is|naam|main)\s+/i, "").trim();
    if (prompted === "complainantPhone" && out.complainantPhone) {
      // already set
    } else if (prompted === "complainantName") {
      // Avoid saving full long story as name
      if (cleaned.length <= 60 && !/hamla|attack|fir|shaam|logon/i.test(cleaned)) {
        out.complainantName = cleaned.replace(/[.,]$/, "");
      }
    } else if (prompted === "occurrencePlace" && cleaned.length <= 120) {
      out.occurrencePlace = cleaned;
    } else if (prompted === "occurrenceDate" && (out.occurrenceDate || cleaned.length <= 40)) {
      out.occurrenceDate = out.occurrenceDate || cleaned;
    } else if (prompted === "policeStation" && cleaned.length <= 80) {
      out.policeStation = cleaned;
    } else if (prompted === "accused" && cleaned.length <= 80) {
      out.accused = cleaned;
    }
  } else if (!prompted && t.length <= 40 && /^[A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F\s.'-]{1,39}$/.test(t)) {
    // Short name-like reply with no other context
    if (!/hamla|attack|shaam|logon|mobile|number|thana/i.test(t)) {
      // only if looks like a name (1–4 words)
      const words = t.split(/\s+/);
      if (words.length <= 4) out.complainantName = t;
    }
  }

  // Place: Connaught Place, etc.
  if (/connaught|cp\b|india gate|chandni|daryaganj|karol bagh|noida|gurgaon|indore|patel nagar/i.test(t)) {
    const placeMatch = t.match(
      /(connaught\s*place[^.,]*|daryaganj[^.,]*|patel nagar[^.,]*|noida[^.,]*|indore[^.,]*)/i
    );
    if (placeMatch) out.occurrencePlace = placeMatch[1].trim();
  }

  return out;
}

/** Pull name mentioned by assistant after "note" e.g. "naam ... Harshvardhan" */
export function extractNameFromAssistant(text: string): string | null {
  const m =
    text.match(
      /(?:naam|name)[^.]*?:\s*([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F\s.'-]{1,40})/i
    ) ||
    text.match(
      /note kar chuka hoon:\s*([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F\s.'-]{1,40})/i
    ) ||
    text.match(
      /(?:aapka naam|your name)[^.]*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/
    );
  if (!m) return null;
  const name = m[1].trim().replace(/[.,].*$/, "");
  if (name.length < 2 || name.length > 50) return null;
  if (/draft|complaint|mobile|number|thana/i.test(name)) return null;
  return name;
}
