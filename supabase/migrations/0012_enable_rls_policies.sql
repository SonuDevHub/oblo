-- 0012_enable_rls_policies.sql
-- Enable Row Level Security (RLS) on all tables and configure strict access policies

-- 1. Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Trigger on profiles to forbid student modifying role or is_blocked
CREATE OR REPLACE FUNCTION public.check_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
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

DROP TRIGGER IF EXISTS trg_prevent_role_tampering ON public.profiles;
CREATE TRIGGER trg_prevent_role_tampering
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_update();

-- 3. Profiles Policies
DROP POLICY IF EXISTS "Authenticated users view profiles" ON public.profiles;
CREATE POLICY "Authenticated users view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users update own profile fields" ON public.profiles;
CREATE POLICY "Users update own profile fields"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 4. Driver Verifications Policies (Writes strictly through RPC)
DROP POLICY IF EXISTS "Users view own verification or admin view all" ON public.driver_verifications;
CREATE POLICY "Users view own verification or admin view all"
ON public.driver_verifications FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- No direct client INSERT/UPDATE/DELETE; RPC only
DROP POLICY IF EXISTS "No direct client insert on verifications" ON public.driver_verifications;
CREATE POLICY "No direct client insert on verifications"
ON public.driver_verifications FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "No direct client update on verifications" ON public.driver_verifications;
CREATE POLICY "No direct client update on verifications"
ON public.driver_verifications FOR UPDATE
TO authenticated
USING (false);

-- 5. Vehicles Policies (Full row with plate only for owner or admin)
DROP POLICY IF EXISTS "Owner view own vehicles or admin" ON public.vehicles;
CREATE POLICY "Owner view own vehicles or admin"
ON public.vehicles FOR SELECT
TO authenticated
USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "No direct client writes on vehicles" ON public.vehicles;
CREATE POLICY "No direct client writes on vehicles"
ON public.vehicles FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "No direct client update on vehicles" ON public.vehicles;
CREATE POLICY "No direct client update on vehicles"
ON public.vehicles FOR UPDATE
TO authenticated
USING (false);

-- 6. Routes Policies
DROP POLICY IF EXISTS "Authenticated view routes" ON public.routes;
CREATE POLICY "Authenticated view routes"
ON public.routes FOR SELECT
TO authenticated
USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage routes" ON public.routes;
CREATE POLICY "Admin manage routes"
ON public.routes FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. Stops Policies
DROP POLICY IF EXISTS "Authenticated view stops" ON public.stops;
CREATE POLICY "Authenticated view stops"
ON public.stops FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admin manage stops" ON public.stops;
CREATE POLICY "Admin manage stops"
ON public.stops FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 8. Rides Policies (Writes strictly through RPC)
DROP POLICY IF EXISTS "Authenticated view rides" ON public.rides;
CREATE POLICY "Authenticated view rides"
ON public.rides FOR SELECT
TO authenticated
USING (status = 'open' OR owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "No direct client insert on rides" ON public.rides;
CREATE POLICY "No direct client insert on rides"
ON public.rides FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "No direct client update on rides" ON public.rides;
CREATE POLICY "No direct client update on rides"
ON public.rides FOR UPDATE
TO authenticated
USING (false);

-- 9. Ride Requests Policies (Direct writes blocked; RPC only)
DROP POLICY IF EXISTS "Riders, owners and admin view requests" ON public.ride_requests;
CREATE POLICY "Riders, owners and admin view requests"
ON public.ride_requests FOR SELECT
TO authenticated
USING (
  rider_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.rides WHERE id = ride_requests.ride_id AND owner_id = auth.uid()) OR
  public.is_admin()
);

DROP POLICY IF EXISTS "No direct client insert on ride_requests" ON public.ride_requests;
CREATE POLICY "No direct client insert on ride_requests"
ON public.ride_requests FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "No direct client update on ride_requests" ON public.ride_requests;
CREATE POLICY "No direct client update on ride_requests"
ON public.ride_requests FOR UPDATE
TO authenticated
USING (false);

-- 10. Audit Logs Policies (Admin read only; insert via RPC)
DROP POLICY IF EXISTS "Admin view audit logs" ON public.audit_logs;
CREATE POLICY "Admin view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "No direct client insert on audit_logs" ON public.audit_logs;
CREATE POLICY "No direct client insert on audit_logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (false);
