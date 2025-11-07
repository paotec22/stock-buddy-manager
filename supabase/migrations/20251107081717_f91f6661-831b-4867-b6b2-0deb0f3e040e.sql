-- Fix the log_inventory_activity trigger to handle NULL auth properly
CREATE OR REPLACE FUNCTION public.log_inventory_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
    -- Only log if user is authenticated
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
$$;

-- Fix the log_sales_activity trigger to handle NULL auth properly
CREATE OR REPLACE FUNCTION public.log_sales_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
    -- Only log if user is authenticated
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
    END IF;
    
    RETURN NEW;
END;
$$;

-- Fix the log_expense_activity trigger to handle NULL auth properly
CREATE OR REPLACE FUNCTION public.log_expense_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
    -- Only log if user is authenticated
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO activity_logs (
            action_type,
            table_name,
            item_description,
            location,
            amount,
            user_id
        )
        VALUES (
            TG_OP,
            TG_TABLE_NAME,
            NEW.description,
            NEW.location,
            NEW.amount,
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Fix the log_installation_activity trigger to handle NULL auth properly
CREATE OR REPLACE FUNCTION public.log_installation_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
    -- Only log if user is authenticated
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO activity_logs (
            action_type,
            table_name,
            item_description,
            amount,
            user_id
        )
        VALUES (
            TG_OP,
            TG_TABLE_NAME,
            NEW.description,
            NEW.amount,
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$;