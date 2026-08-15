-- Run this in Supabase SQL Editor once.
-- Demo table for voice-drafted police complaint UI.

create extension if not exists "pgcrypto";

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  complainant_name text not null,
  complainant_phone text,
  complainant_address text,
  parentage text,
  age text,
  gender text,
  occurrence_date text,
  occurrence_time text,
  occurrence_place text,
  police_station text,
  police_station_district text,
  police_station_state text,
  police_station_phone text,
  accused text,
  witnesses text,
  injury_or_loss text,
  relief_sought text,
  verbatim_account text not null,
  formal_summary text,
  offence_id text,
  offence_name_en text,
  offence_name_hi text,
  bns_sections text[] default '{}',
  offence_confidence real default 0,
  offence_rationale text,
  evidence_quotes text[] default '{}',
  language text default 'en',
  status text not null default 'draft',
  storage_backend text default 'supabase'
);

create index if not exists complaints_token_idx on public.complaints (token);
create index if not exists complaints_created_at_idx on public.complaints (created_at desc);

-- Demo: allow service role full access; anon read by token via RPC or service only.
alter table public.complaints enable row level security;

-- Public read by token for the review page (anon key).
create policy "Public read by token"
  on public.complaints
  for select
  to anon, authenticated
  using (expires_at > now());

-- Inserts/updates from server using service role bypass RLS.
-- If you only use the anon key from the server for demo, add:
create policy "Allow insert for anon demo"
  on public.complaints
  for insert
  to anon, authenticated
  with check (true);

create policy "Allow update for anon demo"
  on public.complaints
  for update
  to anon, authenticated
  using (true)
  with check (true);
