-- 01b: Create tables and RLS policies (idempotent)

-- Ensure required extensions (gen_random_uuid)
create extension if not exists "pgcrypto";

-- 1) profiles: mirrors auth.users with extra metadata/roles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  role text check (role in ('admin', 'user')) default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) members: managed by admins
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) shifts: one record per member per date
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  date date not null,
  shift_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, date)
);

-- Helpful indexes
create index if not exists idx_shifts_member_id on public.shifts(member_id);
create index if not exists idx_shifts_date on public.shifts(date);
create index if not exists idx_members_employee_id on public.members(employee_id);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.members  enable row level security;
alter table public.shifts   enable row level security;

-- Drop existing policies if they exist (so we can re-apply safely)
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles') then
    execute 'drop policy if exists "profiles_select_own" on public.profiles';
    execute 'drop policy if exists "profiles_update_own" on public.profiles';
  end if;

  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'members') then
    execute 'drop policy if exists "members_select_all_authenticated" on public.members';
    execute 'drop policy if exists "members_admin_insert" on public.members';
    execute 'drop policy if exists "members_admin_update" on public.members';
    execute 'drop policy if exists "members_admin_delete" on public.members';
  end if;

  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shifts') then
    execute 'drop policy if exists "shifts_select_all_authenticated" on public.shifts';
    execute 'drop policy if exists "shifts_admin_insert" on public.shifts';
    execute 'drop policy if exists "shifts_admin_update" on public.shifts';
    execute 'drop policy if exists "shifts_admin_delete" on public.shifts';
  end if;
end
$$;

-- profiles policies: user can select/update only their own profile
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id);

-- members policies:
-- All authenticated users can view members
create policy "members_select_all_authenticated"
on public.members
for select
to authenticated
using (true);

-- Only admins can insert/update/delete
create policy "members_admin_insert"
on public.members
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "members_admin_update"
on public.members
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "members_admin_delete"
on public.members
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- shifts policies:
-- All authenticated users can view shifts
create policy "shifts_select_all_authenticated"
on public.shifts
for select
to authenticated
using (true);

-- Only admins can insert/update/delete
create policy "shifts_admin_insert"
on public.shifts
for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "shifts_admin_update"
on public.shifts
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "shifts_admin_delete"
on public.shifts
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
