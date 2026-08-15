/**
 * Helpline / desk contacts shown on the draft for further enquiry.
 * Defaults are UTF-8 Hindi in source. Env overrides are used only if they
 * look valid (broken Windows/PowerShell encoding on Vercel produced "????").
 */

export type ServiceContacts = {
  assistantName: string;
  assistantPhone: string;
  assistantHours: string;
  controlRoom: string;
  womenHelpline: string;
  cyberHelpline: string;
};

const DEFAULTS: ServiceContacts = {
  assistantName: "पुलिस शिकायत सहायता — नागरिक डेस्क",
  assistantPhone: "1800-111-000",
  assistantHours: "सोम–शनि, प्रातः 09:00–सायं 18:00 (केवल मसौदा सहायता)",
  controlRoom: "112",
  womenHelpline: "181 / 1091",
  cyberHelpline: "1930",
};

/** Reject mojibake / replacement-char env values from bad UTF-8 round-trips */
function cleanEnv(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const v = value.trim();
  if (!v) return fallback;
  // Corrupted: lots of ? or replacement character
  if (/[?]{3,}/.test(v) || v.includes("\uFFFD") || /�/.test(v)) return fallback;
  // Env was set as pure ASCII question marks after encoding failure
  const nonAscii = [...v].filter((c) => c.charCodeAt(0) > 127).length;
  const qMarks = (v.match(/\?/g) || []).length;
  if (qMarks >= 3 && nonAscii === 0 && /[?]/.test(v) && v.replace(/[?\s\d\-:/()]/g, "").length < 3) {
    return fallback;
  }
  return v;
}

export function getServiceContacts(): ServiceContacts {
  return {
    assistantName: cleanEnv(process.env.NEXT_PUBLIC_ASSISTANT_NAME, DEFAULTS.assistantName),
    assistantPhone: cleanEnv(process.env.NEXT_PUBLIC_ASSISTANT_PHONE, DEFAULTS.assistantPhone),
    assistantHours: cleanEnv(process.env.NEXT_PUBLIC_ASSISTANT_HOURS, DEFAULTS.assistantHours),
    controlRoom: cleanEnv(process.env.NEXT_PUBLIC_CONTROL_ROOM, DEFAULTS.controlRoom),
    womenHelpline: cleanEnv(process.env.NEXT_PUBLIC_WOMEN_HELPLINE, DEFAULTS.womenHelpline),
    cyberHelpline: cleanEnv(process.env.NEXT_PUBLIC_CYBER_HELPLINE, DEFAULTS.cyberHelpline),
  };
}
