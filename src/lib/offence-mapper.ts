import { BNS_OFFENCES } from "./bns-catalogue";
import type { OffenceSuggestion } from "./types";

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractEvidenceQuotes(account: string, keywords: string[]): string[] {
  const lines = account
    .split(/[\n.।!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const quotes: string[] = [];
  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lowerKeywords.some((k) => k && lower.includes(k))) {
      quotes.push(line.length > 180 ? `${line.slice(0, 177)}...` : line);
    }
    if (quotes.length >= 3) break;
  }

  if (quotes.length === 0 && account.trim()) {
    const snippet = account.trim().slice(0, 160);
    quotes.push(snippet.length < account.trim().length ? `${snippet}...` : snippet);
  }
  return quotes;
}

/**
 * Catalogue-constrained offence mapper.
 * Never invents BNS sections outside data/bns_offences.v1.json.
 */
export function mapOffence(verbatimAccount: string): OffenceSuggestion {
  const text = normalize(verbatimAccount);
  if (!text || text.length < 8) {
    const fallback = BNS_OFFENCES.find((o) => o.id === "unknown_other")!;
    return {
      offenceId: fallback.id,
      nameEn: fallback.plain_name_en,
      nameHi: fallback.plain_name_hi,
      bnsSections: fallback.bns_sections,
      confidence: 0.2,
      rationale:
        "Account too short to classify confidently. Duty officer at the station will name the offence.",
      evidenceQuotes: extractEvidenceQuotes(verbatimAccount, []),
      severityNote: fallback.severity_note,
    };
  }

  const scored = BNS_OFFENCES.filter((o) => o.id !== "unknown_other").map((offence) => {
    let score = 0;
    const matched: string[] = [];
    for (const kw of offence.keywords) {
      const k = kw.toLowerCase();
      if (k && text.includes(k)) {
        score += k.length > 6 ? 2.5 : 1.5;
        matched.push(kw);
      }
    }
    // Light boost for multi-keyword hits
    if (matched.length >= 2) score += 1.5;
    return { offence, score, matched };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const second = scored[1];

  if (!best || best.score < 1.5) {
    const fallback = BNS_OFFENCES.find((o) => o.id === "unknown_other")!;
    return {
      offenceId: fallback.id,
      nameEn: fallback.plain_name_en,
      nameHi: fallback.plain_name_hi,
      bnsSections: fallback.bns_sections,
      confidence: 0.35,
      rationale:
        "No strong catalogue match. The formal draft still preserves your exact account for the station to classify.",
      evidenceQuotes: extractEvidenceQuotes(verbatimAccount, []),
      severityNote: fallback.severity_note,
    };
  }

  const maxPossible = Math.max(best.offence.keywords.length * 2, 6);
  const confidence = Math.min(0.95, 0.45 + best.score / maxPossible);

  let rationale = `Matched catalogue offence from your words (keywords: ${best.matched
    .slice(0, 5)
    .join(", ")}). Suggested BNS section(s) are from a fixed list — the duty officer decides final sections.`;
  if (second && second.score >= best.score * 0.75 && second.score >= 1.5) {
    rationale += ` Alternate possibility: ${second.offence.plain_name_en}.`;
  }

  return {
    offenceId: best.offence.id,
    nameEn: best.offence.plain_name_en,
    nameHi: best.offence.plain_name_hi,
    bnsSections: best.offence.bns_sections,
    confidence: Number(confidence.toFixed(2)),
    rationale,
    evidenceQuotes: extractEvidenceQuotes(verbatimAccount, best.matched),
    severityNote: best.offence.severity_note,
  };
}
