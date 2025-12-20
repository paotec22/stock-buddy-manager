-- Create installation_requests table
CREATE TABLE public.installation_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  installation_cost NUMERIC NOT NULL DEFAULT 0,
  expenses NUMERIC NOT NULL DEFAULT 0,
  location TEXT NOT NULL DEFAULT 'Main Store',
  status TEXT NOT NULL DEFAULT 'Not installed' CHECK (status IN ('Not installed', 'Installed')),
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  installed_at TIMESTAMP WITH TIME ZONE,
  sale_id BIGINT REFERENCES public.sales(id)
);

-- Enable RLS
ALTER TABLE public.installation_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for admins and uploaders"
ON public.installation_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'uploader')
  )
);

CREATE POLICY "Enable insert for admins and uploaders"
ON public.installation_requests FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'uploader')
  )
);

CREATE POLICY "Enable update for admins and uploaders"
ON public.installation_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'uploader')
  )
);

CREATE POLICY "Enable delete for admins"
ON public.installation_requests FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);