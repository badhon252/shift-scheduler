-- Complete RLS reset and setup
-- Run this first to completely reset all policies

-- Disable RLS temporarily to clean up
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (including any hidden ones)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all policies on members table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'members' AND schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.members';
    END LOOP;
    
    -- Drop all policies on shifts table  
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'shifts' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.shifts';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies
-- Members table policies
CREATE POLICY "members_select_all" ON public.members
    FOR SELECT USING (true);

CREATE POLICY "members_insert_auth" ON public.members  
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "members_update_auth" ON public.members
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "members_delete_auth" ON public.members
    FOR DELETE TO authenticated USING (true);

-- Shifts table policies  
CREATE POLICY "shifts_select_all" ON public.shifts
    FOR SELECT USING (true);

CREATE POLICY "shifts_insert_auth" ON public.shifts
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "shifts_update_auth" ON public.shifts  
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "shifts_delete_auth" ON public.shifts
    FOR DELETE TO authenticated USING (true);

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('members', 'shifts') AND schemaname = 'public'
ORDER BY tablename, policyname;
