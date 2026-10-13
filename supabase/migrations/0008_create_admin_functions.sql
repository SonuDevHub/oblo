-- 0008_create_admin_functions.sql
-- Admin management, stats, and override RPC functions

-- 1. Block / unblock user
CREATE OR REPLACE FUNCTION public.admin_set_user_blocked(
  p_user_id uuid,
  p_blocked boolean
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_res public.profiles;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  IF p_user_id = v_admin_id THEN
    RAISE EXCEPTION 'Admin khud ko block nahi kar sakta';
  END IF;

  UPDATE public.profiles
  SET is_blocked = p_blocked
  WHERE id = p_user_id
  RETURNING * INTO v_res;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    v_admin_id,
    CASE WHEN p_blocked THEN 'block_user' ELSE 'unblock_user' END,
    'profiles',
    p_user_id::text,
    jsonb_build_object('is_blocked', p_blocked)
  );

  RETURN v_res;
END;
$$;

-- 2. Admin override request status (still respects seat capacity)
CREATE OR REPLACE FUNCTION public.admin_override_request(
  p_request_id uuid,
  p_status text,
  p_reason text DEFAULT NULL
)
RETURNS public.ride_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_req public.ride_requests;
  v_ride public.rides;
  v_accepted_count int;
  v_res public.ride_requests;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  IF p_status NOT IN ('Accepted', 'Rejected', 'Cancelled') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT * INTO v_req FROM public.ride_requests WHERE id = p_request_id FOR UPDATE;
  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'Request nahi mili';
  END IF;

  SELECT * INTO v_ride FROM public.rides WHERE id = v_req.ride_id FOR UPDATE;
  IF v_ride.id IS NULL THEN
    RAISE EXCEPTION 'Ride nahi mili';
  END IF;

  IF p_status = 'Accepted' AND v_req.status <> 'Accepted' THEN
    SELECT public.get_accepted_count(v_ride.id) INTO v_accepted_count;
    IF v_accepted_count >= v_ride.total_seats THEN
      RAISE EXCEPTION 'Seats khatam: Ride capacity exceed nahi ho sakti';
    END IF;

    UPDATE public.ride_requests
    SET status = 'Accepted',
        reject_reason = NULL,
        updated_at = now()
    WHERE id = p_request_id
    RETURNING * INTO v_res;

    IF (v_accepted_count + 1) >= v_ride.total_seats THEN
      UPDATE public.ride_requests
      SET status = 'Rejected',
          reject_reason = 'ride_full',
          updated_at = now()
      WHERE ride_id = v_ride.id AND status = 'Pending';
    END IF;

  ELSE
    UPDATE public.ride_requests
    SET status = p_status,
        reject_reason = COALESCE(p_reason, 'Admin override to ' || p_status),
        updated_at = now()
    WHERE id = p_request_id
    RETURNING * INTO v_res;
  END IF;

  PERFORM public.calculate_ride_fares(v_ride.id);

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    v_admin_id,
    'admin_override_request',
    'ride_requests',
    p_request_id::text,
    jsonb_build_object('ride_id', v_ride.id, 'status', p_status, 'reason', p_reason)
  );

  RETURN v_res;
END;
$$;

-- 3. Admin dashboard stats
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users int;
  v_pending_verifications int;
  v_verified_drivers int;
  v_rides_today int;
  v_rides_car_today int;
  v_rides_bike_today int;
  v_requests_pending int;
  v_requests_accepted int;
  v_requests_rejected int;
  v_seats_total int := 0;
  v_seats_accepted int := 0;
  v_fill_percent numeric := 0;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  SELECT COUNT(*) INTO v_total_users FROM public.profiles;
  SELECT COUNT(*) INTO v_pending_verifications FROM public.driver_verifications WHERE status = 'pending';
  SELECT COUNT(*) INTO v_verified_drivers FROM public.driver_verifications WHERE status = 'approved';

  SELECT COUNT(*) INTO v_rides_today FROM public.rides WHERE ride_date = CURRENT_DATE AND status <> 'cancelled';
  SELECT COUNT(*) INTO v_rides_car_today FROM public.rides WHERE ride_date = CURRENT_DATE AND vehicle_type = 'car' AND status <> 'cancelled';
  SELECT COUNT(*) INTO v_rides_bike_today FROM public.rides WHERE ride_date = CURRENT_DATE AND vehicle_type = 'bike' AND status <> 'cancelled';

  SELECT COUNT(*) INTO v_requests_pending FROM public.ride_requests WHERE status = 'Pending';
  SELECT COUNT(*) INTO v_requests_accepted FROM public.ride_requests WHERE status = 'Accepted';
  SELECT COUNT(*) INTO v_requests_rejected FROM public.ride_requests WHERE status = 'Rejected';

  SELECT COALESCE(SUM(total_seats), 0) INTO v_seats_total
  FROM public.rides
  WHERE ride_date = CURRENT_DATE AND status = 'open';

  SELECT COALESCE(COUNT(*), 0) INTO v_seats_accepted
  FROM public.ride_requests req
  JOIN public.rides r ON req.ride_id = r.id
  WHERE r.ride_date = CURRENT_DATE AND req.status = 'Accepted' AND r.status = 'open';

  IF v_seats_total > 0 THEN
    v_fill_percent := ROUND((v_seats_accepted::numeric / v_seats_total::numeric) * 100, 1);
  END IF;

  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'pending_verifications', v_pending_verifications,
    'verified_drivers', v_verified_drivers,
    'rides_today', v_rides_today,
    'rides_car_today', v_rides_car_today,
    'rides_bike_today', v_rides_bike_today,
    'requests_by_status', jsonb_build_object(
      'pending', v_requests_pending,
      'accepted', v_requests_accepted,
      'rejected', v_requests_rejected
    ),
    'seats_filled_percent', v_fill_percent
  );
END;
$$;

-- 4. Admin reset demo stub
CREATE OR REPLACE FUNCTION public.admin_reset_demo()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    auth.uid(),
    'reset_demo_data',
    'system',
    'all',
    jsonb_build_object('timestamp', now())
  );

  RETURN true;
END;
$$;
