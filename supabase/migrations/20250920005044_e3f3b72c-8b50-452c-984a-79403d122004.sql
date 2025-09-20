-- Fix infinite recursion in profiles RLS policies
-- Create a security definer function to get current user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- Create new admin policy using the security definer function
CREATE POLICY "Admins can read all profiles" ON public.profiles
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

-- Add role escalation prevention - create trigger to prevent users from changing their own role
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent users from changing their own role
  IF auth.uid() = NEW.id AND OLD.role != NEW.role THEN
    RAISE EXCEPTION 'Users cannot modify their own role';
  END IF;
  
  -- Only admins can change roles (except for system operations)
  IF auth.uid() IS NOT NULL AND public.get_current_user_role() != 'admin' AND OLD.role != NEW.role THEN
    RAISE EXCEPTION 'Only administrators can modify user roles';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for role escalation prevention
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- Create access logs table for audit trail (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_logs' AND table_schema = 'public') THEN
    CREATE TABLE public.access_logs (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id),
      table_name TEXT NOT NULL,
      action_type TEXT NOT NULL,
      record_id BIGINT,
      accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop and recreate access logs policy
DROP POLICY IF EXISTS "Admins can view access logs" ON public.access_logs;
CREATE POLICY "Admins can view access logs" ON public.access_logs
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

-- Secure all database functions by adding proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_multiple_inventory_items(item_ids bigint[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM "inventory list"
  WHERE id = ANY(item_ids);
END;
$$;