-- Create a function to automatically update inventory when a sale is recorded
CREATE OR REPLACE FUNCTION public.update_inventory_on_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_new_quantity numeric;
BEGIN
  -- Get the inventory item details
  SELECT * INTO v_item
  FROM "inventory list"
  WHERE id = NEW.item_id;
  
  -- Check if item exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item with id % not found', NEW.item_id;
  END IF;
  
  -- Calculate new quantity
  v_new_quantity := v_item."Quantity" - NEW.quantity;
  
  -- Prevent negative inventory
  IF v_new_quantity < 0 THEN
    RAISE EXCEPTION 'Insufficient inventory. Available: %, Requested: %', v_item."Quantity", NEW.quantity;
  END IF;
  
  -- Update inventory with new quantity and recalculated total
  UPDATE "inventory list"
  SET 
    "Quantity" = v_new_quantity,
    "Total" = v_new_quantity * "Price"
  WHERE id = NEW.item_id;
  
  -- Log the update
  RAISE NOTICE 'Inventory updated for item_id %: Quantity reduced by %', NEW.item_id, NEW.quantity;
  
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_inventory_on_sale ON public.sales;

-- Create trigger that fires AFTER insert on sales
CREATE TRIGGER trigger_update_inventory_on_sale
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_on_sale();

-- Add comment for documentation
COMMENT ON FUNCTION public.update_inventory_on_sale() IS 
  'Automatically updates inventory quantities when a sale is recorded. Runs with SECURITY DEFINER to bypass RLS policies.';