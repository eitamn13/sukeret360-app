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
  auth_provider text not null default 'email',
  subscription_status text not null default 'free',
  subscription_plan text not null default 'free',
  subscription_updated_at timestamptz,
  subscription_started_at timestamptz,
  subscription_renews_at timestamptz,
  subscription_active boolean not null default false,
  payment_status text not null default 'none',
  billing_provider text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  billing_currency text not null default 'ils',
  cancel_at_period_end boolean not null default false,
  last_payment_at timestamptz,
  is_admin_managed boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.app_users add column if not exists auth_provider text not null default 'email';
alter table public.app_users add column if not exists subscription_status text not null default 'free';
alter table public.app_users add column if not exists subscription_plan text not null default 'free';
alter table public.app_users add column if not exists subscription_updated_at timestamptz;
alter table public.app_users add column if not exists subscription_started_at timestamptz;
alter table public.app_users add column if not exists subscription_renews_at timestamptz;
alter table public.app_users add column if not exists subscription_active boolean not null default false;
alter table public.app_users add column if not exists payment_status text not null default 'none';
alter table public.app_users add column if not exists billing_provider text;
alter table public.app_users add column if not exists stripe_customer_id text;
alter table public.app_users add column if not exists stripe_subscription_id text;
alter table public.app_users add column if not exists stripe_price_id text;
alter table public.app_users add column if not exists billing_currency text not null default 'ils';
alter table public.app_users add column if not exists cancel_at_period_end boolean not null default false;
alter table public.app_users add column if not exists last_payment_at timestamptz;
alter table public.app_users add column if not exists is_admin_managed boolean not null default false;

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
