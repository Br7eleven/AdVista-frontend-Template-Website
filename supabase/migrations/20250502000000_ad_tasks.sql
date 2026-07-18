-- Create ad_tasks table to store available ads/tasks
CREATE TABLE IF NOT EXISTS public.ad_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL, -- duration in seconds
  reward DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_tasks table to track completed tasks
CREATE TABLE IF NOT EXISTS public.user_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.ad_tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reward_claimed DECIMAL(10, 2) NOT NULL,
  UNIQUE(user_id, task_id, completed_at) -- Allow repeating tasks if they are at different times, or we could restrict to once per day
);

-- Enable RLS
ALTER TABLE public.ad_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

-- Policies for ad_tasks
DROP POLICY IF EXISTS "Ad tasks are viewable by all users" ON public.ad_tasks;
CREATE POLICY "Ad tasks are viewable by all users"
  ON public.ad_tasks FOR SELECT
  USING (is_active = true);

-- Policies for user_tasks
DROP POLICY IF EXISTS "Users can view their own task history" ON public.user_tasks;
CREATE POLICY "Users can view their own task history"
  ON public.user_tasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own task completions" ON public.user_tasks;
CREATE POLICY "Users can insert their own task completions"
  ON public.user_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert initial ad tasks
INSERT INTO public.ad_tasks (title, duration, reward)
VALUES
  ('AdVista Premium', 30, 0.25),
  ('Crypto Pulse', 45, 0.40),
  ('Travel Now', 15, 0.10),
  ('Eco Energy', 60, 0.50)
ON CONFLICT DO NOTHING;

-- Function to securely reward user and log the task
CREATE OR REPLACE FUNCTION complete_ad_task(p_task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_reward DECIMAL;
  v_is_active BOOLEAN;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the task details
  SELECT reward, is_active INTO v_reward, v_is_active
  FROM public.ad_tasks
  WHERE id = p_task_id;

  IF NOT FOUND OR NOT v_is_active THEN
    RAISE EXCEPTION 'Task not found or inactive';
  END IF;

  -- Log the task completion
  INSERT INTO public.user_tasks (user_id, task_id, reward_claimed)
  VALUES (v_user_id, p_task_id, v_reward);

  -- Update user balance in the users table
  UPDATE public.users
  SET balance = COALESCE(balance, 0) + v_reward,
      updated_at = now()
  WHERE id = v_user_id;

  -- Log as earning
  INSERT INTO public.earnings (user_id, amount, source, status)
  VALUES (v_user_id, v_reward, 'Ad Task', 'completed');

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
