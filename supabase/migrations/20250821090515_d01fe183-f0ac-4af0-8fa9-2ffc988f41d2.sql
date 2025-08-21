-- Fix RLS policies for inventory and sales access

-- First, let's clean up the sales table policies to remove conflicts
DROP POLICY IF EXISTS "Enable admin view all sales and users view own sales" ON sales;
DROP POLICY IF EXISTS "Allow users to update their own sales" ON sales;
DROP POLICY IF EXISTS "Allow users to delete their own sales" ON sales;
DROP POLICY IF EXISTS "Enable admin update access for sales" ON sales;
DROP POLICY IF EXISTS "Enable update access for sales dates" ON sales;
DROP POLICY IF EXISTS "Enable sales recording for assigned users" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to view all sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to insert sales" ON sales;
DROP POLICY IF EXISTS "Enable uploader update access for sales dates" ON sales;

-- Create clear, non-conflicting sales policies
CREATE POLICY "Enable read access for admins, uploaders, and assigned users" ON sales
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'uploader')
  )
  OR 
  EXISTS (
    SELECT 1 FROM profile_assignments 
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Enable insert access for admins, uploaders, and assigned users" ON sales
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'uploader')
  )
  OR 
  EXISTS (
    SELECT 1 FROM profile_assignments 
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Enable update access for admins and uploaders" ON sales
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'uploader')
  )
);

CREATE POLICY "Enable delete access for admins only" ON sales
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Update inventory policies to include uploaders without explicit assignments
DROP POLICY IF EXISTS "Enable assigned users read access" ON "inventory list";
DROP POLICY IF EXISTS "Enable assigned users update access" ON "inventory list";

CREATE POLICY "Enable read access for admins, uploaders, and assigned users" ON "inventory list"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'uploader')
  )
  OR 
  EXISTS (
    SELECT 1 FROM profile_assignments 
    WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Enable update access for admins, uploaders, and assigned users" ON "inventory list"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'uploader')
  )
  OR 
  EXISTS (
    SELECT 1 FROM profile_assignments 
    WHERE profile_id = auth.uid()
  )
);