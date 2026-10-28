-- MangaSpace free-tier schema (Supabase)
create table if not exists public.reading_progress (
  user_id text not null,
  comic_id text not null,
  chapter_id text not null,
  page int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, comic_id)
);

create table if not exists public.bookmarks (
  user_id text not null,
  comic_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, comic_id)
);

alter table public.reading_progress enable row level security;
alter table public.bookmarks enable row level security;

-- Authenticated users only; user_id must equal auth.uid().
-- Anonymous users stay localStorage-only (no remote sync).
create policy "progress_select" on public.reading_progress
  for select using (auth.uid()::text = user_id);
create policy "progress_insert" on public.reading_progress
  for insert with check (auth.uid()::text = user_id);
create policy "progress_update" on public.reading_progress
  for update using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);
create policy "progress_delete" on public.reading_progress
  for delete using (auth.uid()::text = user_id);

create policy "bookmarks_select" on public.bookmarks
  for select using (auth.uid()::text = user_id);
create policy "bookmarks_insert" on public.bookmarks
  for insert with check (auth.uid()::text = user_id);
create policy "bookmarks_delete" on public.bookmarks
  for delete using (auth.uid()::text = user_id);
