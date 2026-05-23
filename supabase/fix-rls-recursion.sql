-- ============================================================
-- Fix: infinite recursion in profiles RLS policies
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Drop the recursive admin policy on profiles
DROP POLICY IF EXISTS "Admin read all profiles" ON public.profiles;

-- 2. Create a SECURITY DEFINER function that checks admin role
--    without triggering RLS (runs as the DB owner, bypasses policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- 3. Recreate all admin policies using the function instead of inline subquery

-- applications
DROP POLICY IF EXISTS "Admin select all" ON public.applications;
CREATE POLICY "Admin select all" ON public.applications
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin update all" ON public.applications;
CREATE POLICY "Admin update all" ON public.applications
  FOR UPDATE USING (public.is_admin());

-- applicant_details
DROP POLICY IF EXISTS "Admin applicant_details select" ON public.applicant_details;
CREATE POLICY "Admin applicant_details select" ON public.applicant_details
  FOR SELECT USING (public.is_admin());

-- guarantor_details
DROP POLICY IF EXISTS "Admin guarantor_details select" ON public.guarantor_details;
CREATE POLICY "Admin guarantor_details select" ON public.guarantor_details
  FOR SELECT USING (public.is_admin());

-- profiles (admins can read all profiles)
CREATE POLICY "Admin read all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());
