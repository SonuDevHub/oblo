-- 0004_create_views.sql
-- Security definer helper functions and v_rides_with_seats view

-- Helper to count all accepted requests bypassing caller RLS
CREATE OR REPLACE FUNCTION public.get_accepted_count(p_ride_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::int, 0)
  FROM public.ride_requests
  WHERE ride_id = p_ride_id AND status = 'Accepted';
$$;

-- Helper to check if a user is verified driver bypassing caller RLS
CREATE OR REPLACE FUNCTION public.is_verified_driver(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.driver_verifications
    WHERE user_id = p_user_id AND status = 'approved'
  );
$$;

-- View: v_rides_with_seats (NEVER includes vehicle plate)
CREATE OR REPLACE VIEW public.v_rides_with_seats AS
SELECT
  r.id,
  r.owner_id,
  p.full_name AS owner_name,
  public.is_verified_driver(r.owner_id) AS is_verified_driver,
  r.vehicle_id,
  r.vehicle_type,
  v.brand_model AS vehicle_brand_model,
  v.color AS vehicle_color,
  r.route_id,
  rt.name AS route_name,
  r.start_stop_id,
  s_start.name AS start_stop_name,
  s_start.stop_order AS start_stop_order,
  s_start.km_from_start AS start_km,
  r.end_stop_id,
  s_end.name AS end_stop_name,
  s_end.stop_order AS end_stop_order,
  s_end.km_from_start AS end_km,
  r.ride_date,
  r.ride_time,
  r.total_seats,
  (r.total_seats - public.get_accepted_count(r.id)) AS seats_left,
  (public.get_accepted_count(r.id) >= r.total_seats) AS is_full,
  r.rate_per_km,
  r.status,
  r.created_at
FROM public.rides r
JOIN public.profiles p ON r.owner_id = p.id
JOIN public.vehicles v ON r.vehicle_id = v.id
JOIN public.routes rt ON r.route_id = rt.id
JOIN public.stops s_start ON r.start_stop_id = s_start.id
JOIN public.stops s_end ON r.end_stop_id = s_end.id;
