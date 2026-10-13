-- 0006_create_seat_rpc_functions.sql
-- Seat request, response, and cancellation RPC functions with SELECT ... FOR UPDATE

-- Forward stub for calculate_ride_fares (replaced fully in 0007)
CREATE OR REPLACE FUNCTION public.calculate_ride_fares(p_ride_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN '{}'::jsonb;
END;
$$;

-- 1. Request a seat (Rider)
CREATE OR REPLACE FUNCTION public.request_seat(
  p_ride_id uuid,
  p_pickup_stop_id uuid,
  p_drop_stop_id uuid
)
RETURNS public.ride_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_ride public.rides;
  v_pickup_stop public.stops;
  v_drop_stop public.stops;
  v_start_stop public.stops;
  v_end_stop public.stops;
  v_accepted_count int;
  v_res public.ride_requests;
  v_is_blocked boolean;
  v_dist numeric;
  v_est_fare numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT is_blocked INTO v_is_blocked FROM public.profiles WHERE id = v_user_id;
  IF v_is_blocked IS TRUE THEN
    RAISE EXCEPTION 'Aapka account block hai, admin se contact karein';
  END IF;

  -- Lock the ride row FOR UPDATE to prevent race conditions
  SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id FOR UPDATE;
  IF v_ride.id IS NULL THEN
    RAISE EXCEPTION 'Ride nahi mili';
  END IF;

  IF v_ride.status <> 'open' THEN
    RAISE EXCEPTION 'Yeh ride open nahi hai';
  END IF;

  -- Cannot request own ride
  IF v_ride.owner_id = v_user_id THEN
    RAISE EXCEPTION 'Yeh aapki ride hai';
  END IF;

  -- Past ride check
  IF v_ride.ride_date < CURRENT_DATE OR (v_ride.ride_date = CURRENT_DATE AND v_ride.ride_time < CURRENT_TIME) THEN
    RAISE EXCEPTION 'Yeh ride nikal chuki hai';
  END IF;

  -- Full ride check
  SELECT public.get_accepted_count(p_ride_id) INTO v_accepted_count;
  IF v_accepted_count >= v_ride.total_seats THEN
    RAISE EXCEPTION 'Ride full hai';
  END IF;

  -- Duplicate check (one request per user per ride unless previously rejected/cancelled)
  IF EXISTS (
    SELECT 1 FROM public.ride_requests
    WHERE ride_id = p_ride_id AND rider_id = v_user_id AND status IN ('Pending', 'Accepted')
  ) THEN
    RAISE EXCEPTION 'Aap pehle hi request kar chuke ho';
  END IF;

  -- Stops validation
  SELECT * INTO v_pickup_stop FROM public.stops WHERE id = p_pickup_stop_id AND route_id = v_ride.route_id;
  SELECT * INTO v_drop_stop FROM public.stops WHERE id = p_drop_stop_id AND route_id = v_ride.route_id;
  SELECT * INTO v_start_stop FROM public.stops WHERE id = v_ride.start_stop_id;
  SELECT * INTO v_end_stop FROM public.stops WHERE id = v_ride.end_stop_id;

  IF v_pickup_stop.id IS NULL OR v_drop_stop.id IS NULL THEN
    RAISE EXCEPTION 'Pickup aur drop stops ride ke route ke hone chahiye';
  END IF;

  IF v_pickup_stop.stop_order >= v_drop_stop.stop_order THEN
    RAISE EXCEPTION 'Pickup stop drop stop se pehle hona chahiye';
  END IF;

  IF v_pickup_stop.stop_order < v_start_stop.stop_order OR v_drop_stop.stop_order > v_end_stop.stop_order THEN
    RAISE EXCEPTION 'Stops ride ke start aur end range ke andar hone chahiye';
  END IF;

  v_dist := ABS(v_drop_stop.km_from_start - v_pickup_stop.km_from_start);
  v_est_fare := ROUND(v_dist * v_ride.rate_per_km);

  -- Insert or re-activate previous request
  INSERT INTO public.ride_requests (
    ride_id,
    rider_id,
    pickup_stop_id,
    drop_stop_id,
    status,
    reject_reason,
    fare_estimate
  )
  VALUES (
    p_ride_id,
    v_user_id,
    p_pickup_stop_id,
    p_drop_stop_id,
    'Pending',
    NULL,
    v_est_fare
  )
  ON CONFLICT (ride_id, rider_id) DO UPDATE SET
    pickup_stop_id = EXCLUDED.pickup_stop_id,
    drop_stop_id = EXCLUDED.drop_stop_id,
    status = 'Pending',
    reject_reason = NULL,
    fare_estimate = EXCLUDED.fare_estimate,
    updated_at = now()
  RETURNING * INTO v_res;

  RETURN v_res;
END;
$$;

-- 2. Respond to request (Owner / Admin)
CREATE OR REPLACE FUNCTION public.respond_to_request(
  p_request_id uuid,
  p_status text
)
RETURNS public.ride_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_req public.ride_requests;
  v_ride public.rides;
  v_accepted_count int;
  v_res public.ride_requests;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_status NOT IN ('Accepted', 'Rejected') THEN
    RAISE EXCEPTION 'Invalid status. Sirf Accepted ya Rejected allow hai';
  END IF;

  -- Lock the request row
  SELECT * INTO v_req FROM public.ride_requests WHERE id = p_request_id FOR UPDATE;
  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'Request nahi mili';
  END IF;

  -- Lock the ride row
  SELECT * INTO v_ride FROM public.rides WHERE id = v_req.ride_id FOR UPDATE;
  IF v_ride.id IS NULL THEN
    RAISE EXCEPTION 'Ride nahi mili';
  END IF;

  -- Only ride owner or admin can accept/reject
  IF v_ride.owner_id <> v_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Sirf ride owner yeh kar sakta hai';
  END IF;

  -- Only Pending requests can be accepted/rejected
  IF v_req.status <> 'Pending' THEN
    RAISE EXCEPTION 'Request pehle se process ho chuki hai';
  END IF;

  IF p_status = 'Accepted' THEN
    -- Check seats available under row lock
    SELECT public.get_accepted_count(v_ride.id) INTO v_accepted_count;
    IF v_accepted_count >= v_ride.total_seats THEN
      RAISE EXCEPTION 'Seats khatam';
    END IF;

    UPDATE public.ride_requests
    SET status = 'Accepted',
        reject_reason = NULL,
        updated_at = now()
    WHERE id = p_request_id
    RETURNING * INTO v_res;

    -- If this was the last seat (accepted count now equals total_seats):
    -- Auto-reject all remaining Pending requests in the same transaction!
    IF (v_accepted_count + 1) >= v_ride.total_seats THEN
      UPDATE public.ride_requests
      SET status = 'Rejected',
          reject_reason = 'ride_full',
          updated_at = now()
      WHERE ride_id = v_ride.id AND status = 'Pending';
    END IF;

  ELSIF p_status = 'Rejected' THEN
    UPDATE public.ride_requests
    SET status = 'Rejected',
        reject_reason = 'Owner rejected request',
        updated_at = now()
    WHERE id = p_request_id
    RETURNING * INTO v_res;
  END IF;

  -- Recalculate fares for all riders on the ride
  PERFORM public.calculate_ride_fares(v_ride.id);

  -- Audit log
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    v_user_id,
    'respond_to_request',
    'ride_requests',
    p_request_id::text,
    jsonb_build_object('ride_id', v_ride.id, 'status', p_status, 'rider_id', v_req.rider_id)
  );

  RETURN v_res;
END;
$$;

-- 3. Cancel request (Rider)
CREATE OR REPLACE FUNCTION public.cancel_request(p_request_id uuid)
RETURNS public.ride_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_req public.ride_requests;
  v_ride public.rides;
  v_res public.ride_requests;
  v_was_accepted boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_req FROM public.ride_requests WHERE id = p_request_id FOR UPDATE;
  IF v_req.id IS NULL THEN
    RAISE EXCEPTION 'Request nahi mili';
  END IF;

  IF v_req.rider_id <> v_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Sirf rider apni request cancel kar sakta hai';
  END IF;

  IF v_req.status NOT IN ('Pending', 'Accepted') THEN
    RAISE EXCEPTION 'Yeh request cancel nahi ho sakti';
  END IF;

  v_was_accepted := (v_req.status = 'Accepted');

  -- Lock ride row
  SELECT * INTO v_ride FROM public.rides WHERE id = v_req.ride_id FOR UPDATE;

  UPDATE public.ride_requests
  SET status = 'Cancelled',
      updated_at = now()
  WHERE id = p_request_id
  RETURNING * INTO v_res;

  -- Recalculate fares if an accepted rider cancelled (seat freed)
  IF v_was_accepted THEN
    PERFORM public.calculate_ride_fares(v_ride.id);
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    v_user_id,
    'cancel_request',
    'ride_requests',
    p_request_id::text,
    jsonb_build_object('ride_id', v_req.ride_id, 'previous_status', v_req.status)
  );

  RETURN v_res;
END;
$$;
