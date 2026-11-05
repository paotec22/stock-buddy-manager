-- Allow recording sales for custom / non-inventory products (item_id IS NULL)
ALTER TABLE public.sales
  ALTER COLUMN item_id DROP NOT NULL;

-- Update inventory deduction trigger to skip stock deduction when item_id IS NULL
CREATE OR REPLACE FUNCTION public.update_inventory_on_sale()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item RECORD;
  v_new_quantity numeric;
BEGIN
  -- Custom / non-inventory product sales do not reference an inventory row or deduct stock
  IF NEW.item_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_item
  FROM "inventory list"
  WHERE id = NEW.item_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item with id % not found', NEW.item_id;
  END IF;

  v_new_quantity := v_item."Quantity" - NEW.quantity;

  IF v_new_quantity < 0 THEN
    RAISE EXCEPTION 'Insufficient inventory. Available: %, Requested: %', v_item."Quantity", NEW.quantity;
  END IF;

  -- Mark this transaction as a sale-driven inventory update so the
  -- inventory activity logger can skip it.
  PERFORM set_config('app.skip_inventory_log', 'on', true);

  UPDATE "inventory list"
  SET 
    "Quantity" = v_new_quantity,
    "Total" = v_new_quantity * "Price"
  WHERE id = NEW.item_id;

  RETURN NEW;
END;
$function$;

-- Update sales activity logger so custom product sales (item_id IS NULL) are also logged accurately
CREATE OR REPLACE FUNCTION public.log_sales_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_parts text[];
  v_custom_name text;
  v_custom_location text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    IF NEW.item_id IS NOT NULL THEN
      INSERT INTO activity_logs (
        action_type,
        table_name,
        item_description,
        location,
        quantity,
        amount,
        user_id
      )
      SELECT 
        TG_OP,
        TG_TABLE_NAME,
        inv."Item Description",
        inv.location,
        NEW.quantity,
        NEW.total_amount,
        auth.uid()
      FROM "inventory list" inv
      WHERE inv.id = NEW.item_id;
    ELSE
      v_parts := regexp_match(
        COALESCE(NEW.notes, ''),
        '^\s*\[Product:\s*(.+?)(?:\s*\|\s*Location:\s*(.+?))?\]'
      );
      v_custom_name := COALESCE(
        NULLIF(trim(v_parts[1]), ''),
        NULLIF(trim(NEW.notes), ''),
        'Custom Product Sale'
      );
      v_custom_location := COALESCE(NULLIF(trim(v_parts[2]), ''), 'Showroom');

      INSERT INTO activity_logs (
        action_type,
        table_name,
        item_description,
        location,
        quantity,
        amount,
        user_id
      )
      VALUES (
        TG_OP,
        TG_TABLE_NAME,
        v_custom_name,
        v_custom_location,
        NEW.quantity,
        NEW.total_amount,
        auth.uid()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
