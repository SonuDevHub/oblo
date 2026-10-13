-- 0013_fix_profile_service_role.sql
-- Allow service_role or admin to update profile role while preventing student tampering

CREATE OR REPLACE FUNCTION public.check_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce restriction on non-admin authenticated users
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    IF NEW.role <> OLD.role THEN
      RAISE EXCEPTION 'Aap apna role change nahi kar sakte';
    END IF;
    IF NEW.is_blocked <> OLD.is_blocked THEN
      RAISE EXCEPTION 'Aap blocked status change nahi kar sakte';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
