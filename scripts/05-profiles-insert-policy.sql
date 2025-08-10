-- Allow authenticated users to insert their own profile row if it's missing.
-- This complements the auth.users trigger and helps fix users created before the trigger existed.

create policy if not exists "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);
