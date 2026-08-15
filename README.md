# Police complaint draft (UI demo)

Citizen-facing **web demo** with **OpenAI Realtime voice** (primary) and form backup. Intake → dual document with:

1. **Part A** — formal complaint + suggested **BNS** offence (fixed catalogue)
2. **Part B** — **exact account** (verbatim, no paraphrase)

Print or share a link. **Not a registered FIR. Not legal advice.**

## Stack

- **Next.js** (App Router) — UI + serverless API routes
- **Supabase** — optional Postgres storage (see `supabase/schema.sql`)
- **Local fallback** — `.data/complaints.json` when Supabase env is missing (localhost demo)

## Modes

| Mode | Role |
|------|------|
| **Voice (primary)** | Browser mic → **OpenAI Realtime** (WebRTC) intake agent → draft |
| **Form (backup)** | Type / paste / browser dictation → same draft pipeline |

## Quick start (localhost)

```bash
cd police-complaint-voice
npm install
cp .env.example .env.local
# set OPENAI_API_KEY=sk-...  (standard OpenAI key with Realtime access)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Voice path
1. Stay on **Voice (OpenAI) · primary**
2. **Start voice intake** → allow microphone
3. Answer the agent (Hindi / English / Hinglish)
4. **Finish & generate draft** (or let the agent finalize)
5. Print / share `/d/<token>`

### Form path
1. Switch to **Form · backup**
2. Load sample or type → **Generate complaint draft**

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com)
2. SQL Editor → run `supabase/schema.sql`
3. Copy URL + anon key (and optionally service role) into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # optional but better for server writes
```

4. Restart `npm run dev`. `GET /api/health` should show `"storage":"supabase"`.

## API

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Storage mode + catalogue size |
| `POST` | `/api/complaints` | Create draft from JSON body |
| `GET` | `/api/complaints/:token` | Load draft JSON |
| `PATCH` | `/api/complaints/:token` | Edit structured fields only (not verbatim) |

## Exact account preservation

- `verbatimAccount` is stored as submitted (line endings normalized only)
- Offence mapping never rewrites the narrative
- PATCH cannot change Part B text

## Later (not in this demo)

- Twilio phone number + OpenAI Realtime agent
- SMS/WhatsApp delivery of the same `/d/:token` link

## Disclaimer

Suggested BNS sections are from a **small demo catalogue** and may be wrong or incomplete. The duty officer at the station decides the offence and whether to register an FIR. Call **112** in an emergency.
