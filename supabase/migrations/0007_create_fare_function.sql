-- 0007_create_fare_function.sql
-- Fare calculation function implementing segment-wise cost splitting

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

  -- Temporary structures
  v_segments JSONB := '[]'::jsonb;
  v_seg_idx int := 0;
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

  -- Calculate driver fare
  SELECT COALESCE(SUM(cost / people_count), 0)
  INTO v_driver_fare
  FROM _temp_ride_segments;

  SELECT COALESCE(SUM(cost), 0)
  INTO v_total_cost
  FROM _temp_ride_segments;

  -- Calculate and update fare for each Accepted rider
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

    v_rider_fares := jsonb_set(
      v_rider_fares,
      ARRAY[v_req.id::text],
      to_jsonb(ROUND(v_rider_fare))
    );
  END LOOP;

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
    'driver_share', ROUND(v_driver_fare),
    'accepted_fares', v_rider_fares
  );

  RETURN v_result;
END;
$$;
