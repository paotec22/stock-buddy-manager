-- 1. Create enum type for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'uploader', 'user', 'inventory_manager');

-- 2. Create user_roles table with proper structure
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::app_role
FROM public.profiles
WHERE role IS NOT NULL;

-- 6. Create RLS policies for user_roles table
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 7. Update get_current_user_role function to use new table
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 8. Drop the role escalation trigger (no longer needed with separate table)
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_role_escalation();

-- 9. Remove role column from profiles (keep for backward compatibility for now, will be deprecated)
-- ALTER TABLE public.profiles DROP COLUMN role; -- Commented out to avoid breaking existing code immediately

-- 10. Fix nullable user_id columns - First update any NULL values to a system user
DO $$
DECLARE
  system_user_id UUID;
BEGIN
  -- Get first admin user or any user as fallback
  SELECT user_id INTO system_user_id FROM public.user_roles WHERE role = 'admin' LIMIT 1;
  
  IF system_user_id IS NULL THEN
    SELECT id INTO system_user_id FROM auth.users LIMIT 1;
  END IF;
  
  -- Update NULL user_ids
  IF system_user_id IS NOT NULL THEN
    UPDATE public.expenses SET user_id = system_user_id WHERE user_id IS NULL;
    UPDATE public.installations SET user_id = system_user_id WHERE user_id IS NULL;
    UPDATE public.invoices SET user_id = system_user_id WHERE user_id IS NULL;
    UPDATE public.sales SET user_id = system_user_id WHERE user_id IS NULL;
    UPDATE public.activity_logs SET user_id = system_user_id WHERE user_id IS NULL;
  END IF;
END $$;

-- 11. Add NOT NULL constraints
ALTER TABLE public.expenses ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.installations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.sales ALTER COLUMN user_id SET NOT NULL;

-- 12. Add validation to trigger functions
CREATE OR REPLACE FUNCTION public.log_inventory_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- Validate authentication
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required for inventory operations';
    END IF;
    
    -- Validate required fields
    IF NEW."Item Description" IS NULL OR NEW.location IS NULL THEN
        RAISE EXCEPTION 'Invalid inventory record: missing required fields';
    END IF;
    
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
        COALESCE(auth.uid(), NEW."Item Description"::uuid) -- Fallback to prevent NULL
    );
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_sales_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required for sales operations';
    END IF;
    
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
$function$;

CREATE OR REPLACE FUNCTION public.log_expense_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required for expense operations';
    END IF;
    
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
$function$;

CREATE OR REPLACE FUNCTION public.log_installation_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required for installation operations';
    END IF;
    
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
$function$;