-- ============================================================
-- STEP 1: Run this entire file in Supabase → SQL Editor
-- ============================================================

-- ── Table 1: Reference prompts (replaces Airtable "Web Image Analysis") ──
create table if not exists web_image_analysis (
  id              uuid primary key default gen_random_uuid(),
  airtable_id     text unique,          -- original Airtable record ID, useful during transition
  image_name      text,
  prompt_name     text,
  brand_name      text,
  format_layout   text,
  primary_object  text,
  subject         text,
  lighting        text,
  mood            text,
  background      text,
  positive_prompt text,
  negative_prompt text,
  created_at      timestamptz default now()
);

-- ── Table 2: Liked / favorited generated images ───────────────────────────
create table if not exists liked_images (
  id          uuid primary key default gen_random_uuid(),
  record_id   text unique,              -- used by like/unlike webhooks
  img_url     text not null,
  brand_name  text,
  created_at  timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────
-- The frontend (anon key) can READ both tables.
-- n8n (service role key) can do everything — service role bypasses RLS automatically.

alter table web_image_analysis enable row level security;
alter table liked_images        enable row level security;

create policy "anon can read web_image_analysis"
  on web_image_analysis for select using (true);

create policy "anon can read liked_images"
  on liked_images for select using (true);

-- ── Table 3: All generated images (ChatGPT, Gemini, edits, variations) ──
create table if not exists generated_images (
  id           uuid primary key default gen_random_uuid(),
  public_url   text not null,           -- GDrive CDN URL of the image
  provider     text,                    -- 'chatgpt' | 'gemini' | 'edit' | 'variation'
  aspect_ratio text,                    -- '16:9' | '1:1' | 'edited' | 'varied'
  resolution   text,                    -- '1K' | '2K' | '3K' | '4K'
  filename     text,                    -- human-readable filename
  storage_path text default '',         -- reserved for future Supabase Storage use
  brand_name   text,                    -- brand this image belongs to
  created_at   timestamptz default now()
);

alter table generated_images enable row level security;

-- Anyone with the anon key can read images
create policy "anon can read generated_images"
  on generated_images for select using (true);

-- Anyone with the anon key can insert (frontend saves directly)
create policy "anon can insert generated_images"
  on generated_images for insert with check (true);

-- Anyone with the anon key can delete their own images
create policy "anon can delete generated_images"
  on generated_images for delete using (true);

-- ── Migrations: safely add columns to existing generated_images table ──
-- These run after the CREATE TABLE above, so they only matter for databases
-- that already had the table without these columns.
alter table generated_images add column if not exists brand_name   text;
alter table generated_images add column if not exists storage_path text default '';
alter table generated_images add column if not exists resolution   text;
alter table generated_images add column if not exists aspect_ratio text;
alter table generated_images add column if not exists filename     text;

-- ── Storage bucket for generated images ──────────────────────────────────
-- Creates a PUBLIC bucket — images get a permanent public URL (no auth needed).
insert into storage.buckets (id, name, public)
values ('generated-images', 'generated-images', true)
on conflict (id) do nothing;

create policy "public can view generated-images"
  on storage.objects for select
  using (bucket_id = 'generated-images');

create policy "service role can upload generated-images"
  on storage.objects for insert
  with check (bucket_id = 'generated-images');

create policy "service role can delete generated-images"
  on storage.objects for delete
  using (bucket_id = 'generated-images');
