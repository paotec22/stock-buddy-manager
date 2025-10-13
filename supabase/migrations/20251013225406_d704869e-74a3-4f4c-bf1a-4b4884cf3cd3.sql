-- Fix access_logs table RLS policies
-- Add INSERT policy to allow authenticated users to insert their own logs
CREATE POLICY "Allow authenticated log insertion" ON access_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy to prevent all updates (logs are immutable)
CREATE POLICY "Prevent log modifications" ON access_logs
FOR UPDATE
USING (false);

-- Add DELETE policy for admins only
CREATE POLICY "Admins can delete logs" ON access_logs
FOR DELETE
USING (public.get_current_user_role() = 'admin');

-- Harden delete_multiple_inventory_items function with explicit authorization
CREATE OR REPLACE FUNCTION public.delete_multiple_inventory_items(item_ids bigint[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Explicit authentication check
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check user has admin or uploader role
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  IF user_role NOT IN ('admin', 'uploader') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Validate input array
  IF item_ids IS NULL OR array_length(item_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Invalid item IDs provided';
  END IF;
  
  -- Perform deletion
  DELETE FROM "inventory list"
  WHERE id = ANY(item_ids);
END;
$$;