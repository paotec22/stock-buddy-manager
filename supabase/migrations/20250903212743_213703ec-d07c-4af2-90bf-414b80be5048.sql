-- Add inventory_manager role to existing profiles and update RLS policies

-- Update the profiles table role check (if there are any constraints)
-- Add RLS policy for inventory managers to access inventory

-- Enable inventory managers to read inventory
CREATE POLICY "Enable inventory managers read access to inventory"
ON "inventory list"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'inventory_manager'
  )
);

-- Enable inventory managers to insert inventory
CREATE POLICY "Enable inventory managers insert access to inventory"
ON "inventory list"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'inventory_manager'
  )
);

-- Update activity logs to allow inventory managers to read their own actions
CREATE POLICY "Enable inventory managers read access to activity logs"
ON activity_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'inventory_manager'
  )
);