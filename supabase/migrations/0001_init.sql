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

-- Anonymous (anon key) read/write scoped by user_id stored client-side.
-- For production, replace with auth.uid() policies.
create policy "progress_select" on public.reading_progress for select using (true);
create policy "progress_upsert" on public.reading_progress for insert with check (true);
create policy "progress_update" on public.reading_progress for update using (true);
create policy "bookmarks_select" on public.bookmarks for select using (true);
create policy "bookmarks_insert" on public.bookmarks for insert with check (true);
create policy "bookmarks_delete" on public.bookmarks for delete using (true);