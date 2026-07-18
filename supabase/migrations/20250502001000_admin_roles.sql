-- Add is_admin column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create policies for admins to view all data
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can view all referrals"
  ON public.referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can view all earnings"
  ON public.earnings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can view all withdrawals"
  ON public.withdrawals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all withdrawals"
  ON public.withdrawals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Function to approve or reject a withdrawal
CREATE OR REPLACE FUNCTION process_withdrawal(p_withdrawal_id UUID, p_status TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if current user is admin
  SELECT is_admin INTO v_is_admin FROM public.users WHERE id = auth.uid();
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  IF p_status NOT IN ('completed', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status. Use completed or rejected';
  END IF;

  UPDATE public.withdrawals
  SET status = p_status,
      updated_at = now()
  WHERE id = p_withdrawal_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
