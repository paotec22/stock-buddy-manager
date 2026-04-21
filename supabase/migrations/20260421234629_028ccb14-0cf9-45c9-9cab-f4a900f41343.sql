-- Update sales activity trigger to set a session flag before inventory deduction
-- so that the inventory log trigger can skip logging the auto-deduction.

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

-- Update inventory activity logger to honor the skip flag
CREATE OR REPLACE FUNCTION public.log_inventory_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Skip logging when the change was triggered by a sale
    IF current_setting('app.skip_inventory_log', true) = 'on' THEN
        RETURN NEW;
    END IF;

    IF auth.uid() IS NOT NULL THEN
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
            NEW."Item Description",
            NEW.location,
            NEW."Quantity",
            NEW."Total",
            auth.uid()
        );
    END IF;

    RETURN NEW;
END;
$function$;