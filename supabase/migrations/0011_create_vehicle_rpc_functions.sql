-- 0011_create_vehicle_rpc_functions.sql
-- Vehicle management RPC functions and sensitive contact retrieval

-- 1. Add vehicle
CREATE OR REPLACE FUNCTION public.add_vehicle(
  p_vehicle_type text,
  p_brand_model text,
  p_color text,
  p_plate_number text
)
RETURNS public.vehicles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_plate text;
  v_res public.vehicles;
  v_is_blocked boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT is_blocked INTO v_is_blocked FROM public.profiles WHERE id = v_user_id;
  IF v_is_blocked IS TRUE THEN
    RAISE EXCEPTION 'Aapka account block hai, admin se contact karein';
  END IF;

  IF p_vehicle_type NOT IN ('car', 'bike') THEN
    RAISE EXCEPTION 'Vehicle type sirf car ya bike ho sakta hai';
  END IF;

  v_plate := upper(regexp_replace(trim(p_plate_number), '\s+', '', 'g'));
  IF v_plate !~ '^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$' THEN
    RAISE EXCEPTION 'Invalid number plate format (e.g. RJ14AB1234)';
  END IF;

  IF EXISTS (SELECT 1 FROM public.vehicles WHERE plate_number = v_plate AND is_active = true) THEN
    RAISE EXCEPTION 'Yeh number plate pehle se registered hai';
  END IF;

  INSERT INTO public.vehicles (owner_id, vehicle_type, brand_model, color, plate_number, is_active)
  VALUES (v_user_id, p_vehicle_type, trim(p_brand_model), trim(p_color), v_plate, true)
  RETURNING * INTO v_res;

  RETURN v_res;
END;
$$;

-- 2. Update vehicle
CREATE OR REPLACE FUNCTION public.update_vehicle(
  p_vehicle_id uuid,
  p_brand_model text,
  p_color text,
  p_plate_number text
)
RETURNS public.vehicles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_vehicle public.vehicles;
  v_plate text;
  v_res public.vehicles;
  v_has_active_bookings boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_vehicle FROM public.vehicles WHERE id = p_vehicle_id;
  IF v_vehicle.id IS NULL THEN
    RAISE EXCEPTION 'Gaadi nahi mili';
  END IF;

  IF v_vehicle.owner_id <> v_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Sirf gaadi ka owner yeh kar sakta hai';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.rides r
    JOIN public.ride_requests req ON r.id = req.ride_id
    WHERE r.vehicle_id = p_vehicle_id
      AND req.status IN ('Pending', 'Accepted')
  ) INTO v_has_active_bookings;

  IF v_has_active_bookings THEN
    RAISE EXCEPTION 'Booking ho chuki hai, ab badlav nahi ho sakta';
  END IF;

  v_plate := upper(regexp_replace(trim(p_plate_number), '\s+', '', 'g'));
  IF v_plate !~ '^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$' THEN
    RAISE EXCEPTION 'Invalid number plate format';
  END IF;

  IF EXISTS (SELECT 1 FROM public.vehicles WHERE plate_number = v_plate AND id <> p_vehicle_id AND is_active = true) THEN
    RAISE EXCEPTION 'Yeh number plate pehle se registered hai';
  END IF;

  UPDATE public.vehicles
  SET brand_model = trim(p_brand_model),
      color = trim(p_color),
      plate_number = v_plate
  WHERE id = p_vehicle_id
  RETURNING * INTO v_res;

  RETURN v_res;
END;
$$;

-- 3. Delete vehicle (soft delete)
CREATE OR REPLACE FUNCTION public.delete_vehicle(p_vehicle_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_vehicle public.vehicles;
  v_has_active_bookings boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_vehicle FROM public.vehicles WHERE id = p_vehicle_id;
  IF v_vehicle.id IS NULL THEN
    RAISE EXCEPTION 'Gaadi nahi mili';
  END IF;

  IF v_vehicle.owner_id <> v_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Sirf gaadi ka owner yeh kar sakta hai';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.rides r
    JOIN public.ride_requests req ON r.id = req.ride_id
    WHERE r.vehicle_id = p_vehicle_id
      AND req.status IN ('Pending', 'Accepted')
  ) INTO v_has_active_bookings;

  IF v_has_active_bookings THEN
    RAISE EXCEPTION 'Booking ho chuki hai, ab badlav nahi ho sakta';
  END IF;

  UPDATE public.vehicles SET is_active = false WHERE id = p_vehicle_id;
  RETURN true;
END;
$$;

-- 4. Get ride contact (Reveals phone and plate ONLY to owner, Accepted riders, or admin)
CREATE OR REPLACE FUNCTION public.get_ride_contact(p_ride_id uuid)
RETURNS TABLE (
  owner_name text,
  owner_phone text,
  plate_number text,
  brand_model text,
  color text,
  vehicle_type text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_ride public.rides;
  v_is_accepted boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id;
  IF v_ride.id IS NULL THEN
    RAISE EXCEPTION 'Ride nahi mili';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.ride_requests
    WHERE ride_id = p_ride_id AND rider_id = v_user_id AND status = 'Accepted'
  ) INTO v_is_accepted;

  IF v_ride.owner_id <> v_user_id AND NOT v_is_accepted AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Contact details sirf accepted riders ya owner ko dikhti hain';
  END IF;

  RETURN QUERY
  SELECT
    p.full_name,
    p.phone,
    v.plate_number,
    v.brand_model,
    v.color,
    v.vehicle_type
  FROM public.rides r
  JOIN public.profiles p ON r.owner_id = p.id
  JOIN public.vehicles v ON r.vehicle_id = v.id
  WHERE r.id = p_ride_id;
END;
$$;
