-- Add uploader role to profiles table by updating the default constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'uploader', 'user'));

-- Update RLS policies for inventory to allow uploaders to insert
CREATE POLICY "Enable uploader insert access to inventory" 
ON "inventory list"
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'uploader')
));

-- Update RLS policies for sales to allow uploaders to update dates
CREATE POLICY "Enable uploader update access for sales dates" 
ON sales
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'uploader')
));