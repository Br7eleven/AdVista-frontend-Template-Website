-- Add INSERT policy for users table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add a policy to allow authenticated users to create their own profile
DROP POLICY IF EXISTS "Authenticated users can create their own profile" ON public.users;
CREATE POLICY "Authenticated users can create their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
