-- Fix infinite RLS recursion across ALL tables that reference public.users in admin policies.
-- Root cause: admin policies used recursive subquery pattern:
--   EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true)
-- inside USING clauses, causing PostgreSQL to re-evaluate RLS on public.users for the inner query.
--
-- Fix: create a SECURITY DEFINER function that bypasses RLS,
-- then rewrite ALL admin policies to use it instead of inline subqueries.

-- ============================================================================
-- 1. Create SECURITY DEFINER function that bypasses RLS entirely
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin_user(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(is_admin, false) FROM public.users WHERE id = uid;
$$;

-- ============================================================================
-- 2. Fix admin policies on public.users (also removes duplicates from seed.sql)
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins view users" ON public.users;

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT
  USING (public.is_admin_user(auth.uid()));

-- ============================================================================
-- 3. Fix admin policies on public.referrals
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all referrals" ON public.referrals;

CREATE POLICY "Admins can view all referrals" ON public.referrals
  FOR SELECT
  USING (public.is_admin_user(auth.uid()));

-- ============================================================================
-- 4. Fix admin policies on public.earnings
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all earnings" ON public.earnings;

CREATE POLICY "Admins can view all earnings" ON public.earnings
  FOR SELECT
  USING (public.is_admin_user(auth.uid()));

-- ============================================================================
-- 5. Fix admin policies on public.withdrawals (also removes duplicates from seed.sql)
-- ============================================================================
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins view withdrawals" ON public.withdrawals;

CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals
  FOR SELECT
  USING (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins update withdrawals" ON public.withdrawals;

CREATE POLICY "Admins can update all withdrawals" ON public.withdrawals
  FOR UPDATE
  USING (public.is_admin_user(auth.uid()));
