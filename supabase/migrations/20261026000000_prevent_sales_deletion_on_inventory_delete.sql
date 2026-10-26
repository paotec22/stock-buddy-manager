-- Migration: Prevent sales and invoice items deletion when inventory items are deleted
-- Sets ON DELETE SET NULL on foreign keys referencing "inventory list"

ALTER TABLE public.sales
  DROP CONSTRAINT IF EXISTS sales_item_id_fkey;

ALTER TABLE public.sales
  ADD CONSTRAINT sales_item_id_fkey
  FOREIGN KEY (item_id)
  REFERENCES public."inventory list"(id)
  ON DELETE SET NULL;

ALTER TABLE public.invoice_items
  DROP CONSTRAINT IF EXISTS invoice_items_item_id_fkey;

ALTER TABLE public.invoice_items
  ADD CONSTRAINT invoice_items_item_id_fkey
  FOREIGN KEY (item_id)
  REFERENCES public."inventory list"(id)
  ON DELETE SET NULL;
