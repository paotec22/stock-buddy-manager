-- Drop the insecure policy that allows all users to read all profiles
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Create secure policies for profile access
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT 
USING (auth.uid() = id);

-- Allow admins to read all profiles (needed for role management and user assignments)
CREATE POLICY "Admins can read all profiles" ON public.profiles
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p2 
  WHERE p2.id = auth.uid() 
  AND p2.role = 'admin'
));