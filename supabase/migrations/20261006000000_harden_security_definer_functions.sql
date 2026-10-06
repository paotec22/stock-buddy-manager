-- Security Hardening Migration: Restrict SECURITY DEFINER RPC Functions
-- Prevents unauthenticated and unauthorized callers from invoking bulk deletion or modifying inventory

-- 1. Harden delete_multiple_inventory_items
CREATE OR REPLACE FUNCTION public.delete_multiple_inventory_items(item_ids bigint[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is an authenticated administrator
  IF auth.uid() IS NULL OR public.get_current_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Access Denied: Only administrators are authorized to execute bulk inventory deletion.';
  END IF;

  DELETE FROM "inventory list"
  WHERE id = ANY(item_ids);
END;
$$;

-- Revoke public & anon access, grant only to authenticated role
REVOKE EXECUTE ON FUNCTION public.delete_multiple_inventory_items(bigint[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.delete_multiple_inventory_items(bigint[]) TO authenticated;

-- 2. Harden upsert_inventory_item
CREATE OR REPLACE FUNCTION public.upsert_inventory_item(
  p_item_description text, 
  p_price numeric, 
  p_quantity numeric, 
  p_location text DEFAULT 'Main Store'::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is an authenticated admin or uploader
  IF auth.uid() IS NULL OR public.get_current_user_role() NOT IN ('admin', 'uploader') THEN
    RAISE EXCEPTION 'Access Denied: Only administrators and uploaders are authorized to modify inventory.';
  END IF;

  INSERT INTO "inventory list" ("Item Description", "Price", "Quantity", "location", "Total")
  VALUES (p_item_description, p_price, p_quantity, p_location, p_price * p_quantity)
  ON CONFLICT ("Item Description", "location") 
  DO UPDATE SET 
      "Quantity" = "inventory list"."Quantity" + EXCLUDED."Quantity",
      "Total" = "inventory list"."Price" * ("inventory list"."Quantity" + EXCLUDED."Quantity");
END;
$$;

-- Revoke public & anon access, grant only to authenticated role
REVOKE EXECUTE ON FUNCTION public.upsert_inventory_item(text, numeric, numeric, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.upsert_inventory_item(text, numeric, numeric, text) TO authenticated;
