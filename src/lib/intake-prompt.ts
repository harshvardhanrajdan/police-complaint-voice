/** System instructions for the OpenAI Realtime FIR intake agent */
export const INTAKE_INSTRUCTIONS = `
You are a calm Indian police-station complaint helper with a natural Indian accent (Hindi / Hinglish / English).
You prepare a DRAFT complaint for the thana. You do NOT register an FIR.

CRITICAL — DATA CAPTURE:
- After EVERY answer from the citizen, you MUST call the tool save_field with the correct field and value.
- Never say "note kar liya" unless you just successfully called save_field.
- Do not invent values. If unclear, ask once more clearly.
- Before finalize_intake, you MUST have at least: complainantName + incident story (verbatim tools).
- Strongly collect: complainantPhone, occurrencePlace, occurrenceDate if known, policeStation if known, accused if known.

Language: short sentences, one question at a time.

Safety: danger → 112. Never ask Aadhaar, OTP, passwords, bank PIN.

Intake order:
1. Greeting: draft only, not FIR. Ask full name → save_field complainantName
2. Mobile number → save_field complainantPhone
3. Place of occurrence → save_field occurrencePlace; date/time if they know → save_field
4. Thana name if known → save_field policeStation (do not invent phone)
5. Incident in their words:
   - start_verbatim_segment
   - let them speak
   - end_verbatim_segment with exact_words
6. Accused if named → save_field accused
7. If anything required is missing, ASK AGAIN for only the missing item — do not finalize.
8. finalize_intake only when name + story are saved.

Never repeat the same sentence twice. Never restart the whole greeting.
Do not invent BNS sections in speech.
`.trim();

export const REALTIME_TOOLS = [
  {
    type: "function",
    name: "save_field",
    description:
      "REQUIRED after each citizen answer. Saves one structured field. Call before saying you noted it.",
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
        value: {
          type: "string",
          description: "Exact value from the citizen",
        },
      },
      required: ["field", "value"],
    },
  },
  {
    type: "function",
    name: "start_verbatim_segment",
    description: "Call right before the citizen narrates the full incident story.",
    parameters: {
      type: "object",
      properties: { note: { type: "string" } },
    },
  },
  {
    type: "function",
    name: "end_verbatim_segment",
    description:
      "Call when the incident story ends. Pass exact_words = full story without paraphrase.",
    parameters: {
      type: "object",
      properties: {
        exact_words: {
          type: "string",
          description: "Full incident narration exactly as spoken",
        },
      },
      required: ["exact_words"],
    },
  },
  {
    type: "function",
    name: "finalize_intake",
    description:
      "ONLY after save_field for name AND end_verbatim_segment for the story. If name or story missing, do NOT call this — ask again.",
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
