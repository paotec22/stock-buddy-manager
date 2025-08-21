-- Allow uploaders to insert expenses
CREATE POLICY "Enable uploader insert access to expenses" ON expenses
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'uploader')
  )
);