-- Core schema and RLS for public read + authenticated write (no role check)

create extension if not exists "pgcrypto";

-- Members
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Shifts
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  date date not null,
  shift_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, date)
);

-- Indexes
create index if not exists idx_members_employee_id on public.members(employee_id);
create index if not exists idx_shifts_member_id on public.shifts(member_id);
create index if not exists idx_shifts_date on public.shifts(date);

-- Enable RLS
alter table public.members enable row level security;
alter table public.shifts enable row level security;

-- Drop all existing policies first
drop policy if exists "members_select_anon" on public.members;
drop policy if exists "members_select_auth" on public.members;
drop policy if exists "members_select_public" on public.members;
drop policy if exists "members_admin_insert" on public.members;
drop policy if exists "members_admin_update" on public.members;
drop policy if exists "members_admin_delete" on public.members;
drop policy if exists "members_authenticated_insert" on public.members;
drop policy if exists "members_authenticated_update" on public.members;
drop policy if exists "members_authenticated_delete" on public.members;

drop policy if exists "shifts_select_anon" on public.shifts;
drop policy if exists "shifts_select_auth" on public.shifts;
drop policy if exists "shifts_select_public" on public.shifts;
drop policy if exists "shifts_admin_insert" on public.shifts;
drop policy if exists "shifts_admin_update" on public.shifts;
drop policy if exists "shifts_admin_delete" on public.shifts;
drop policy if exists "shifts_authenticated_insert" on public.shifts;
drop policy if exists "shifts_authenticated_update" on public.shifts;
drop policy if exists "shifts_authenticated_delete" on public.shifts;

-- Create new policies
-- Allow everyone to read (including anonymous users)
create policy "Enable read access for all users" on public.members
  for select using (true);

create policy "Enable read access for all users" on public.shifts
  for select using (true);

-- Allow authenticated users to insert, update, delete
create policy "Enable insert for authenticated users only" on public.members
  for insert to authenticated with check (true);

create policy "Enable update for authenticated users only" on public.members
  for update to authenticated using (true) with check (true);

create policy "Enable delete for authenticated users only" on public.members
  for delete to authenticated using (true);

create policy "Enable insert for authenticated users only" on public.shifts
  for insert to authenticated with check (true);

create policy "Enable update for authenticated users only" on public.shifts
  for update to authenticated using (true) with check (true);

create policy "Enable delete for authenticated users only" on public.shifts
  for delete to authenticated using (true);
