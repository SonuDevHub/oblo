-- 0005_create_ride_rpc_functions.sql
-- Ride creation, search, and cancellation RPC functions

-- 1. Create ride
CREATE OR REPLACE FUNCTION public.create_ride(
  p_vehicle_id uuid,
  p_route_id uuid,
  p_start_stop_id uuid,
  p_end_stop_id uuid,
  p_ride_date date,
  p_ride_time time,
  p_total_seats int,
  p_rate_per_km numeric
)
RETURNS public.rides
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_vehicle public.vehicles;
  v_start_stop public.stops;
  v_end_stop public.stops;
  v_today_rides_count int;
  v_res public.rides;
  v_is_blocked boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT is_blocked INTO v_is_blocked FROM public.profiles WHERE id = v_user_id;
  IF v_is_blocked IS TRUE THEN
    RAISE EXCEPTION 'Aapka account block hai, admin se contact karein';
  END IF;

  -- Must be verified driver
  IF NOT public.is_verified_driver(v_user_id) THEN
    RAISE EXCEPTION 'Pehle verification approve hona chahiye';
  END IF;

  -- Vehicle check
  SELECT * INTO v_vehicle FROM public.vehicles WHERE id = p_vehicle_id AND is_active = true;
  IF v_vehicle.id IS NULL OR v_vehicle.owner_id <> v_user_id THEN
    RAISE EXCEPTION 'Yeh gaadi aapki nahi hai';
  END IF;

  -- Seat limits by vehicle type
  IF v_vehicle.vehicle_type = 'bike' AND p_total_seats <> 1 THEN
    RAISE EXCEPTION 'Bike pe sirf 1 seat ho sakti hai';
  ELSIF v_vehicle.vehicle_type = 'car' AND (p_total_seats < 1 OR p_total_seats > 3) THEN
    RAISE EXCEPTION 'Car mein max 3 seats (driver ke alawa)';
  END IF;

  -- Date check (not in past)
  IF p_ride_date < CURRENT_DATE OR (p_ride_date = CURRENT_DATE AND p_ride_time < CURRENT_TIME) THEN
    RAISE EXCEPTION 'Yeh ride nikal chuki hai';
  END IF;

  -- Rate check
  IF p_rate_per_km < 1 OR p_rate_per_km > 50 THEN
    RAISE EXCEPTION 'Rate per km ₹1 se ₹50 ke beech hona chahiye';
  END IF;

  -- Stops check
  SELECT * INTO v_start_stop FROM public.stops WHERE id = p_start_stop_id AND route_id = p_route_id;
  SELECT * INTO v_end_stop FROM public.stops WHERE id = p_end_stop_id AND route_id = p_route_id;

  IF v_start_stop.id IS NULL OR v_end_stop.id IS NULL THEN
    RAISE EXCEPTION 'Stops select kiye gaye route ke hone chahiye';
  END IF;

  IF v_start_stop.stop_order >= v_end_stop.stop_order THEN
    RAISE EXCEPTION 'Start stop must come before end stop';
  END IF;

  -- Daily limit (max 5 rides per user per day)
  SELECT COUNT(*) INTO v_today_rides_count
  FROM public.rides
  WHERE owner_id = v_user_id
    AND ride_date = p_ride_date
    AND status <> 'cancelled';

  IF v_today_rides_count >= 5 THEN
    RAISE EXCEPTION 'Rozana max 5 rides allow hain';
  END IF;

  INSERT INTO public.rides (
    owner_id,
    vehicle_id,
    vehicle_type,
    route_id,
    start_stop_id,
    end_stop_id,
    ride_date,
    ride_time,
    total_seats,
    rate_per_km,
    status
  )
  VALUES (
    v_user_id,
    p_vehicle_id,
    v_vehicle.vehicle_type,
    p_route_id,
    p_start_stop_id,
    p_end_stop_id,
    p_ride_date,
    p_ride_time,
    p_total_seats,
    p_rate_per_km,
    'open'
  )
  RETURNING * INTO v_res;

  RETURN v_res;
END;
$$;

-- 2. Search rides
CREATE OR REPLACE FUNCTION public.search_rides(
  p_from_stop_id uuid,
  p_to_stop_id uuid,
  p_date date,
  p_pref_time time DEFAULT NULL,
  p_vehicle_type text DEFAULT NULL,
  p_page int DEFAULT 1,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  ride_id uuid,
  owner_id uuid,
  owner_name text,
  is_verified_driver boolean,
  vehicle_type text,
  vehicle_brand_model text,
  vehicle_color text,
  route_id uuid,
  route_name text,
  start_stop_id uuid,
  start_stop_name text,
  end_stop_id uuid,
  end_stop_name text,
  ride_date date,
  ride_time time,
  total_seats int,
  seats_left int,
  is_full boolean,
  rate_per_km numeric,
  estimated_fare numeric,
  time_diff_minutes int,
  is_exact_route boolean,
  status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from_stop public.stops;
  v_to_stop public.stops;
  v_offset int := GREATEST(0, (COALESCE(p_page, 1) - 1) * COALESCE(p_limit, 20));
BEGIN
  SELECT * INTO v_from_stop FROM public.stops WHERE id = p_from_stop_id;
  SELECT * INTO v_to_stop FROM public.stops WHERE id = p_to_stop_id;

  IF v_from_stop.id IS NULL OR v_to_stop.id IS NULL OR v_from_stop.route_id <> v_to_stop.route_id THEN
    RETURN;
  END IF;

  IF v_from_stop.stop_order >= v_to_stop.stop_order THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v.id AS ride_id,
    v.owner_id,
    v.owner_name,
    v.is_verified_driver,
    v.vehicle_type,
    v.vehicle_brand_model,
    v.vehicle_color,
    v.route_id,
    v.route_name,
    v.start_stop_id,
    v.start_stop_name,
    v.end_stop_id,
    v.end_stop_name,
    v.ride_date,
    v.ride_time,
    v.total_seats,
    v.seats_left,
    v.is_full,
    v.rate_per_km,
    ROUND(ABS(v_to_stop.km_from_start - v_from_stop.km_from_start) * v.rate_per_km) AS estimated_fare,
    CASE
      WHEN p_pref_time IS NOT NULL THEN
        ROUND(ABS(EXTRACT(EPOCH FROM (v.ride_time - p_pref_time))) / 60)::int
      ELSE 0
    END AS time_diff_minutes,
    (v.start_stop_id = p_from_stop_id AND v.end_stop_id = p_to_stop_id) AS is_exact_route,
    v.status
  FROM public.v_rides_with_seats v
  JOIN public.profiles pr ON v.owner_id = pr.id
  WHERE v.route_id = v_from_stop.route_id
    AND v.ride_date = p_date
    AND (p_date > CURRENT_DATE OR (p_date = CURRENT_DATE AND v.ride_time >= CURRENT_TIME))
    AND v.status = 'open'
    AND pr.is_blocked = false
    AND v.start_stop_order <= v_from_stop.stop_order
    AND v.end_stop_order >= v_to_stop.stop_order
    AND (p_vehicle_type IS NULL OR p_vehicle_type = '' OR v.vehicle_type = p_vehicle_type)
  ORDER BY
    v.is_full ASC, -- Available rides first, Full rides last
    (v.start_stop_id = p_from_stop_id AND v.end_stop_id = p_to_stop_id) DESC, -- Exact route first
    CASE
      WHEN p_pref_time IS NOT NULL THEN
        ABS(EXTRACT(EPOCH FROM (v.ride_time - p_pref_time)))
      ELSE 0
    END ASC,
    v.ride_time ASC
  LIMIT COALESCE(p_limit, 20)
  OFFSET v_offset;
END;
$$;

-- 3. Cancel ride
CREATE OR REPLACE FUNCTION public.cancel_ride(p_ride_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_ride public.rides;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id;
  IF v_ride.id IS NULL THEN
    RAISE EXCEPTION 'Ride nahi mili';
  END IF;

  IF v_ride.owner_id <> v_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Sirf ride owner ya admin ride cancel kar sakte hain';
  END IF;

  UPDATE public.rides SET status = 'cancelled' WHERE id = p_ride_id;

  -- Auto-reject all pending and accepted requests
  UPDATE public.ride_requests
  SET status = 'Rejected',
      reject_reason = 'Ride cancelled by owner',
      updated_at = now()
  WHERE ride_id = p_ride_id AND status IN ('Pending', 'Accepted');

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    v_user_id,
    'cancel_ride',
    'rides',
    p_ride_id::text,
    jsonb_build_object('previous_status', v_ride.status)
  );

  RETURN true;
END;
$$;
