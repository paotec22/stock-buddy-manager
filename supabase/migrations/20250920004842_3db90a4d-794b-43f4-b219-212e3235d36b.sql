-- Fix infinite recursion in profiles RLS policies
-- First, create a security definer function to get current user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;

-- Create new admin policy using the security definer function
CREATE POLICY "Admins can read all profiles" ON public.profiles
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

-- Add role escalation prevention - create trigger to prevent users from changing their own role
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow admins to change any role except their own
  IF auth.uid() = NEW.id AND OLD.role != NEW.role THEN
    RAISE EXCEPTION 'Users cannot modify their own role';
  END IF;
  
  -- Only admins can change roles
  IF public.get_current_user_role() != 'admin' AND OLD.role != NEW.role THEN
    RAISE EXCEPTION 'Only administrators can modify user roles';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for role escalation prevention
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- Enhance customer data protection - add audit logging table
CREATE TABLE IF NOT EXISTS public.access_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  record_id BIGINT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "Admins can view access logs" ON public.access_logs
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

-- Secure database functions by adding proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_multiple_inventory_items(item_ids bigint[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM "inventory list"
  WHERE id = ANY(item_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_inventory_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_sales_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
        NEW.user_id
    FROM "inventory list" inv
    WHERE inv.id = NEW.item_id;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_installation_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
        NEW.user_id
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_inventory_item(p_item_description text, p_price numeric, p_quantity numeric, p_location text DEFAULT 'Main Store'::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO "inventory list" ("Item Description", "Price", "Quantity", "location", "Total")
    VALUES (p_item_description, p_price, p_quantity, p_location, p_price * p_quantity)
    ON CONFLICT ("Item Description", "location") 
    DO UPDATE SET 
        "Quantity" = "inventory list"."Quantity" + EXCLUDED."Quantity",
        "Total" = "inventory list"."Price" * ("inventory list"."Quantity" + EXCLUDED."Quantity");
END;
$$;

CREATE OR REPLACE FUNCTION public.log_expense_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
        NEW.user_id
    );
    RETURN NEW;
END;
$$;