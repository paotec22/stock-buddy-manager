-- Allow uploaders to view expenses
CREATE POLICY "Enable uploader read access to expenses" ON expenses
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'uploader')
  )
);

-- Allow uploaders to view activity logs for reports
CREATE POLICY "Enable uploader read access to activity logs" ON activity_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'uploader')
  )
);