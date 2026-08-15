/**
 * Helpline / desk contacts shown on the draft for further enquiry.
 * Override via env without code changes.
 */
export type ServiceContacts = {
  assistantName: string;
  assistantPhone: string;
  assistantHours: string;
  controlRoom: string;
  womenHelpline: string;
  cyberHelpline: string;
};

export function getServiceContacts(): ServiceContacts {
  return {
    assistantName:
      process.env.NEXT_PUBLIC_ASSISTANT_NAME?.trim() ||
      "पुलिस शिकायत सहायता — नागरिक डेस्क",
    assistantPhone:
      process.env.NEXT_PUBLIC_ASSISTANT_PHONE?.trim() || "1800-111-000",
    assistantHours:
      process.env.NEXT_PUBLIC_ASSISTANT_HOURS?.trim() ||
      "सोम–शनि, प्रातः 09:00–सायं 18:00 (केवल मसौदा सहायता)",
    controlRoom: process.env.NEXT_PUBLIC_CONTROL_ROOM?.trim() || "112",
    womenHelpline: process.env.NEXT_PUBLIC_WOMEN_HELPLINE?.trim() || "181 / 1091",
    cyberHelpline: process.env.NEXT_PUBLIC_CYBER_HELPLINE?.trim() || "1930",
  };
}
