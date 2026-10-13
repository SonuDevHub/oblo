-- 0014_phase1_fixes.sql
-- Exact fare calculation, standardized error messages from docs/USER_FLOW.md §12

-- 1. Exact fare calculation with driver share = route trip cost - SUM(accepted rider fares)
CREATE OR REPLACE FUNCTION public.calculate_ride_fares(p_ride_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ride public.rides;
  v_start_order int;
  v_end_order int;
  v_rate numeric;
  v_total_cost numeric := 0;
  v_driver_fare numeric := 0;
  v_sum_accepted_fares numeric := 0;

  v_req RECORD;
  v_rider_fare numeric;
  v_pending_fare numeric;
  v_result JSONB := '{}'::jsonb;
  v_rider_fares JSONB := '{}'::jsonb;
BEGIN
  SELECT * INTO v_ride FROM public.rides WHERE id = p_ride_id;
  IF v_ride.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Ride not found');
  END IF;

  SELECT stop_order INTO v_start_order FROM public.stops WHERE id = v_ride.start_stop_id;
  SELECT stop_order INTO v_end_order FROM public.stops WHERE id = v_ride.end_stop_id;
  v_rate := v_ride.rate_per_km;

  -- Create temporary table to store ordered segments for this ride
  CREATE TEMP TABLE IF NOT EXISTS _temp_ride_segments (
    seg_id int,
    from_order int,
    to_order int,
    km numeric,
    cost numeric,
    people_count int
  ) ON COMMIT DROP;
  TRUNCATE TABLE _temp_ride_segments;

  -- Populate consecutive segments from ride start to end
  WITH ordered_stops AS (
    SELECT id, stop_order, km_from_start
    FROM public.stops
    WHERE route_id = v_ride.route_id
      AND stop_order >= v_start_order
      AND stop_order <= v_end_order
    ORDER BY stop_order ASC
  ),
  consecutive_segments AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY s1.stop_order) AS seg_id,
      s1.stop_order AS from_order,
      s2.stop_order AS to_order,
      ABS(s2.km_from_start - s1.km_from_start) AS km,
      ABS(s2.km_from_start - s1.km_from_start) * v_rate AS cost
    FROM ordered_stops s1
    JOIN ordered_stops s2 ON s2.stop_order = (
      SELECT MIN(s3.stop_order) FROM ordered_stops s3 WHERE s3.stop_order > s1.stop_order
    )
  )
  INSERT INTO _temp_ride_segments (seg_id, from_order, to_order, km, cost, people_count)
  SELECT
    cs.seg_id,
    cs.from_order,
    cs.to_order,
    cs.km,
    cs.cost,
    1 + ( -- 1 for driver + accepted riders on this segment
      SELECT COUNT(*)::int
      FROM public.ride_requests req
      JOIN public.stops sp ON req.pickup_stop_id = sp.id
      JOIN public.stops sd ON req.drop_stop_id = sd.id
      WHERE req.ride_id = p_ride_id
        AND req.status = 'Accepted'
        AND sp.stop_order <= cs.from_order
        AND sd.stop_order >= cs.to_order
    ) AS people_count
  FROM consecutive_segments cs;

  SELECT COALESCE(SUM(cost), 0)
  INTO v_total_cost
  FROM _temp_ride_segments;

  -- Calculate and update fare for each Accepted rider (rounded)
  v_sum_accepted_fares := 0;
  FOR v_req IN
    SELECT req.id, req.rider_id, sp.stop_order AS pickup_order, sd.stop_order AS drop_order
    FROM public.ride_requests req
    JOIN public.stops sp ON req.pickup_stop_id = sp.id
    JOIN public.stops sd ON req.drop_stop_id = sd.id
    WHERE req.ride_id = p_ride_id
      AND req.status = 'Accepted'
  LOOP
    SELECT COALESCE(SUM(cost / people_count), 0)
    INTO v_rider_fare
    FROM _temp_ride_segments
    WHERE from_order >= v_req.pickup_order
      AND to_order <= v_req.drop_order;

    UPDATE public.ride_requests
    SET fare_estimate = ROUND(v_rider_fare),
        updated_at = now()
    WHERE id = v_req.id;

    v_sum_accepted_fares := v_sum_accepted_fares + ROUND(v_rider_fare);

    v_rider_fares := jsonb_set(
      v_rider_fares,
      ARRAY[v_req.id::text],
      to_jsonb(ROUND(v_rider_fare))
    );
  END LOOP;

  -- Driver share = route trip cost - SUM(accepted rider fares)
  v_driver_fare := ROUND(v_total_cost) - v_sum_accepted_fares;

  -- Also update fare_estimate for Pending requests (assuming they join the ride)
  FOR v_req IN
    SELECT req.id, req.rider_id, sp.stop_order AS pickup_order, sd.stop_order AS drop_order
    FROM public.ride_requests req
    JOIN public.stops sp ON req.pickup_stop_id = sp.id
    JOIN public.stops sd ON req.drop_stop_id = sd.id
    WHERE req.ride_id = p_ride_id
      AND req.status = 'Pending'
  LOOP
    SELECT COALESCE(SUM(cost / (people_count + 1)), 0)
    INTO v_pending_fare
    FROM _temp_ride_segments
    WHERE from_order >= v_req.pickup_order
      AND to_order <= v_req.drop_order;

    UPDATE public.ride_requests
    SET fare_estimate = ROUND(v_pending_fare),
        updated_at = now()
    WHERE id = v_req.id;
  END LOOP;

  v_result := jsonb_build_object(
    'ride_id', p_ride_id,
    'total_cost', ROUND(v_total_cost),
    'driver_share', v_driver_fare,
    'accepted_fares', v_rider_fares
  );

  RETURN v_result;
END;
$$;

-- 2. Ensure respond_to_request raises exactly 'Seats khatam'
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

-- 3. create_ride with USER_FLOW.md §12 error messages & start = end check
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
    RAISE EXCEPTION 'Ride dene ke liye pehle verification karein';
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

  IF p_start_stop_id = p_end_stop_id OR v_start_stop.stop_order >= v_end_stop.stop_order THEN
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

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    v_user_id,
    'create_ride',
    'rides',
    v_res.id::text,
    jsonb_build_object('vehicle_type', v_res.vehicle_type, 'total_seats', v_res.total_seats, 'route_id', v_res.route_id)
  );

  RETURN v_res;
END;
$$;
