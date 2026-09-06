-- Create accessories table for spare parts and components
-- (Spare parts may or may not have a specific price)
CREATE TABLE IF NOT EXISTS public.accessories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  part_number TEXT,
  category TEXT DEFAULT 'General Spares',
  compatible_with TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  price NUMERIC NULL, -- Optional: price can be NULL for unpriced spare parts
  location TEXT NOT NULL DEFAULT 'Ikeja',
  condition TEXT DEFAULT 'New',
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accessories ENABLE ROW LEVEL SECURITY;

-- Allow all read/write for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'accessories' AND policyname = 'Allow all for authenticated users'
  ) THEN
    CREATE POLICY "Allow all for authenticated users" ON public.accessories
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'accessories' AND policyname = 'Allow anon read write accessories'
  ) THEN
    CREATE POLICY "Allow anon read write accessories" ON public.accessories
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accessories_location ON public.accessories(location);
CREATE INDEX IF NOT EXISTS idx_accessories_category ON public.accessories(category);
