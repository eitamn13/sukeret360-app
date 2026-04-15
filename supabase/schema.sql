create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  app_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.user_app_state enable row level security;
alter table public.app_users enable row level security;

drop policy if exists "Users can read own app state" on public.user_app_state;
create policy "Users can read own app state"
on public.user_app_state
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own app state" on public.user_app_state;
create policy "Users can insert own app state"
on public.user_app_state
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own app state" on public.user_app_state;
create policy "Users can update own app state"
on public.user_app_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own app state" on public.user_app_state;
create policy "Users can delete own app state"
on public.user_app_state
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can read own app user" on public.app_users;
create policy "Users can read own app user"
on public.app_users
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own app user" on public.app_users;
create policy "Users can insert own app user"
on public.app_users
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own app user" on public.app_users;
create policy "Users can update own app user"
on public.app_users
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
