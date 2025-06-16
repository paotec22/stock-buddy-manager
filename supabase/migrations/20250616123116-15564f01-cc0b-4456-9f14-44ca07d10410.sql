
-- Add a column to store the actual purchase price for each sale
ALTER TABLE sales ADD COLUMN actual_purchase_price numeric;

-- Update existing sales with the current inventory prices
UPDATE sales 
SET actual_purchase_price = inv."Price"
FROM "inventory list" inv 
WHERE sales.item_id = inv.id 
AND sales.actual_purchase_price IS NULL;
