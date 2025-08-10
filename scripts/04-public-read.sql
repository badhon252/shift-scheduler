-- Allow anonymous public read access for landing page (read-only)
-- Keep existing authenticated policies. These are additive.

-- Members: allow SELECT for anon
create policy if not exists "members_select_anon"
on public.members
for select
to anon
using (true);

-- Shifts: allow SELECT for anon
create policy if not exists "shifts_select_anon"
on public.shifts
for select
to anon
using (true);
