-- MangaSpace: user profiles + owner-only RLS + auto-create on signup.
-- Profiles store a display name and avatar so accounts are manageable in-app.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text check (char_length(display_name) <= 60),
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Owner reads their own profile.
create policy "profiles_select" on public.profiles
  for select using (auth.uid()::text = id::text);
-- Owner inserts/updates only their own profile row.
create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid()::text = id::text);
create policy "profiles_update" on public.profiles
  for update using (auth.uid()::text = id::text) with check (auth.uid()::text = id::text);

-- Seed a profile row for every new auth user (email, magic link, or OAuth).
-- security definer so the write succeeds regardless of caller RLS; search_path pinned.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync when an account's verified email changes
-- (e.g. after the user changes it in-app). security definer, pinned search_path.
create or replace function public.handle_sync_user_email()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = new.email, updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update on auth.users
  for each row execute function public.handle_sync_user_email();
