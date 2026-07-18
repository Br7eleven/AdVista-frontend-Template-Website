-- ==========================================
-- UPDATED SEED & INFRASTRUCTURE SCRIPT
-- Aligned with your specific schema
-- ==========================================

-- 1. FIX MISSING COLUMNS IN EXISTING TABLES
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS payment_details TEXT;

-- 2. CREATE MISSING INFRASTRUCTURE TABLES
-- Catalog of available ads
CREATE TABLE IF NOT EXISTS public.ad_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL, -- seconds
  reward DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Record of completions
CREATE TABLE IF NOT EXISTS public.user_task_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.ad_tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reward_claimed DECIMAL(10, 2) NOT NULL
);

-- Notifications system
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. SECURITY (RLS)
ALTER TABLE public.ad_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for Ad Tasks
DROP POLICY IF EXISTS "Ad tasks viewable by all" ON public.ad_tasks;
CREATE POLICY "Ad tasks viewable by all" ON public.ad_tasks FOR SELECT USING (is_active = true);

-- Policies for User Logs
DROP POLICY IF EXISTS "Users view own logs" ON public.user_task_logs;
CREATE POLICY "Users view own logs" ON public.user_task_logs FOR SELECT USING (auth.uid() = user_id);

-- Policies for Notifications
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Admin View Policies
DROP POLICY IF EXISTS "Admins view users" ON public.users;
CREATE POLICY "Admins view users" ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins view withdrawals" ON public.withdrawals;
CREATE POLICY "Admins view withdrawals" ON public.withdrawals FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins update withdrawals" ON public.withdrawals;
CREATE POLICY "Admins update withdrawals" ON public.withdrawals FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true));

-- 4. SECURE FUNCTIONS (RPC)

-- Secure Reward Logic
CREATE OR REPLACE FUNCTION complete_ad_task(p_task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_reward DECIMAL;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN FALSE; END IF;

  SELECT reward INTO v_reward FROM public.ad_tasks WHERE id = p_task_id AND is_active = true;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- Log completion
  INSERT INTO public.user_task_logs (user_id, task_id, reward_claimed) VALUES (v_user_id, p_task_id, v_reward);
  
  -- Update user stats
  UPDATE public.users 
  SET balance = balance + v_reward,
      total_earned = total_earned + v_reward,
      tasks_completed = tasks_completed + 1
  WHERE id = v_user_id;
  
  -- Notify user
  INSERT INTO public.notifications (user_id, title, message, type) 
  VALUES (v_user_id, 'Reward Earned!', 'You earned $' || v_reward || ' for watching an ad.', 'success');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure Withdrawal Processing
CREATE OR REPLACE FUNCTION process_withdrawal(p_withdrawal_id UUID, p_status TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_amount DECIMAL;
BEGIN
  IF NOT (SELECT is_admin FROM public.users WHERE id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.withdrawals 
  SET status = p_status, processed_at = now() 
  WHERE id = p_withdrawal_id
  RETURNING user_id, amount INTO v_user_id, v_amount;

  INSERT INTO public.notifications (user_id, title, message, type) 
  VALUES (v_user_id, 'Withdrawal ' || INITCAP(p_status), 'Your withdrawal of $' || v_amount || ' has been ' || p_status || '.', 
  CASE WHEN p_status = 'completed' THEN 'success' ELSE 'error' END);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. DATA SEED
INSERT INTO public.ad_tasks (title, duration, reward)
VALUES
  ('AdVista Premium', 30, 0.25),
  ('Crypto Pulse', 45, 0.40),
  ('Travel Now', 15, 0.10),
  ('Eco Energy', 60, 0.50)
ON CONFLICT DO NOTHING;

-- 6. MAKE YOURSELF ADMIN
-- UPDATE public.users SET is_admin = true WHERE email = 'your@email.com';
