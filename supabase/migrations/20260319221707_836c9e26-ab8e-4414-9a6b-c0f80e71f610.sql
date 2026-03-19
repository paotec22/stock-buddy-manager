-- Add payment status and amount paid columns to sales table
ALTER TABLE public.sales 
ADD COLUMN payment_status text NOT NULL DEFAULT 'paid',
ADD COLUMN amount_paid numeric NOT NULL DEFAULT 0;

-- Update existing sales to have amount_paid = total_amount (they're all considered paid)
UPDATE public.sales SET amount_paid = total_amount WHERE payment_status = 'paid';

-- Add a check constraint for valid payment statuses
ALTER TABLE public.sales 
ADD CONSTRAINT valid_payment_status CHECK (payment_status IN ('paid', 'unpaid', 'part_paid'));