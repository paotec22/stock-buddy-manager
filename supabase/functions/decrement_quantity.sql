CREATE OR REPLACE FUNCTION decrement_quantity(row_id bigint, amount integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  current_quantity integer;
BEGIN
  SELECT "Quantity" INTO current_quantity
  FROM "inventory list"
  WHERE id = row_id;
  
  IF current_quantity >= amount THEN
    RETURN current_quantity - amount;
  ELSE
    RAISE EXCEPTION 'Insufficient quantity in inventory';
  END IF;
END;
$$;