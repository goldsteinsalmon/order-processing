

-- Set the order_number_seq to start at 1001
SELECT setval('public.order_number_seq', 1000, true);

-- Create a function to set the order number sequence
CREATE OR REPLACE FUNCTION public.set_order_number_sequence(start_value integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Set the sequence to the specified start value
  PERFORM setval('public.order_number_seq', start_value, true);
  RETURN true;
END;
$function$;

-- Ensure the trigger function exists
CREATE OR REPLACE FUNCTION public.set_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only set order_number if it's not already set
  IF NEW.order_number IS NULL THEN
    NEW.order_number := nextval('public.order_number_seq');
  END IF;
  RETURN NEW;
END;
$function$;

-- Make sure the trigger is attached to the orders table
DROP TRIGGER IF EXISTS set_order_number_trigger ON public.orders;
CREATE TRIGGER set_order_number_trigger
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_number();

