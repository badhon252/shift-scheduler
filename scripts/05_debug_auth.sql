-- Debug script to check authentication and RLS status
-- Run this to diagnose authentication issues

-- Check current authentication context
SELECT 
    current_user,
    session_user,
    current_setting('role', true) as current_role,
    current_setting('request.jwt.claims', true) as jwt_claims;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrls as has_rls
FROM pg_tables 
WHERE tablename IN ('members', 'shifts') 
AND schemaname = 'public';

-- List all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename IN ('members', 'shifts') 
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Test anonymous access (should work for SELECT)
SET ROLE anon;
SELECT 'Testing anon SELECT on members' as test;
SELECT COUNT(*) as member_count FROM public.members;
SELECT 'Testing anon SELECT on shifts' as test;
SELECT COUNT(*) as shift_count FROM public.shifts;
RESET ROLE;

-- Check if there are any triggers that might interfere
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('members', 'shifts')
AND event_object_schema = 'public';

-- Check table constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('members', 'shifts')
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;
