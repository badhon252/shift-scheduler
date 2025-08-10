-- Test script to verify RLS policies are working
-- Run this after the reset script to test functionality

-- Test 1: Check if policies exist
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename IN ('members', 'shifts') AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Test 2: Check RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('members', 'shifts') AND schemaname = 'public';

-- Test 3: Test anonymous read access (should work)
SET ROLE anon;
SELECT COUNT(*) as member_count FROM public.members;
SELECT COUNT(*) as shift_count FROM public.shifts;
RESET ROLE;

-- Test 4: Show current auth context (for debugging)
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_setting('role') as current_role;

-- Test 5: Check if there are any conflicting policies
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    pol.polname as policy_name,
    pol.polcmd as command,
    pol.polpermissive as permissive,
    pol.polroles as roles,
    pg_get_expr(pol.polqual, pol.polrelid) as using_expression,
    pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expression
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname IN ('members', 'shifts')
ORDER BY schema_name, table_name, policy_name;
