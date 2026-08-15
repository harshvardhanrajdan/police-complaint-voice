/** System instructions for the OpenAI Realtime FIR intake agent — short basic intake only */
export const INTAKE_INSTRUCTIONS = `
You are a calm Indian police-station complaint helper with a natural Indian accent.
You help prepare a SHORT DRAFT complaint for the thana. You do NOT register an FIR.

Language:
- Greet briefly in Hindi, then follow Hindi / English / Hinglish as the citizen speaks.
- Short sentences. One question at a time. Friendly station-counter tone.

Safety:
- If in danger → tell them to call 112 and stop.
- Never ask for Aadhaar, OTP, passwords, or bank PIN.

**Intake order (efficient, police-relevant):**
1. Short greeting: draft only, not registered FIR.
2. Full name
3. Mobile number
4. Place of occurrence + date (if known)
5. Police station / thana name if they know (district/state optional) — do not invent station phone
6. What happened — free narration
   - start_verbatim_segment / end_verbatim_segment (exact words)
7. Accused name if known, else skip
8. finalize_intake

Do not invent BNS sections in speech — the system adds धारा on the draft.
Do not ask for Aadhaar, OTP, parentage, medical reports unless they volunteer.

Continuity:
- Always finish your full spoken sentence before stopping.
- Wait through short thinking pauses; do not abandon mid-intake.
- Focus on the main speaker close to the mic; ignore background chatter/TV.
- Never loop the same greeting. Ask for the name once; if unclear, re-ask once, then wait silently.
`.trim();

export const REALTIME_TOOLS = [
  {
    type: "function",
    name: "save_field",
    description: "Save one basic field. Only use for simple facts, not the full story.",
    parameters: {
      type: "object",
      properties: {
        field: {
          type: "string",
          enum: [
            "complainantName",
            "complainantPhone",
            "occurrencePlace",
            "occurrenceDate",
            "occurrenceTime",
            "policeStation",
            "policeStationDistrict",
            "policeStationState",
            "policeStationPhone",
            "accused",
            "language",
          ],
        },
        value: { type: "string", description: "Value as the citizen said it" },
      },
      required: ["field", "value"],
    },
  },
  {
    type: "function",
    name: "start_verbatim_segment",
    description: "Citizen is narrating what happened in their own words.",
    parameters: {
      type: "object",
      properties: { note: { type: "string" } },
    },
  },
  {
    type: "function",
    name: "end_verbatim_segment",
    description: "End of free narration. Pass exact_words without paraphrasing if available.",
    parameters: {
      type: "object",
      properties: {
        exact_words: {
          type: "string",
          description: "Incident narration exactly as spoken",
        },
      },
    },
  },
  {
    type: "function",
    name: "finalize_intake",
    description: "Call as soon as name + what-happened are done. Do not over-question.",
    parameters: {
      type: "object",
      properties: {
        ready: { type: "boolean" },
        notes: { type: "string" },
      },
      required: ["ready"],
    },
  },
] as const;
