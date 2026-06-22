
CREATE POLICY "Authenticated can view inventory images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'inventory-images');

CREATE POLICY "Authenticated can upload inventory images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'inventory-images');

CREATE POLICY "Authenticated can update inventory images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'inventory-images');

CREATE POLICY "Authenticated can delete inventory images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'inventory-images');
