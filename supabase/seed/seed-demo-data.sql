-- supabase/seed/seed-demo-data.sql
-- Seed script for Campus Carpool Matcher demo environment

DO $$
DECLARE
  v_r1_id uuid;
  v_r2_id uuid;
  v_s62_id uuid;
  v_s_indirapuram_id uuid;
  v_s_vaishali_id uuid;
  v_s_college1_id uuid;

  v_s_anand_id uuid;
  v_s_kaushambi_id uuid;
  v_s_mohan_id uuid;
  v_s_college2_id uuid;

  v_rahul_id uuid;
  v_priya_id uuid;
  v_aman_id uuid;
  v_neha_id uuid;
  v_admin_id uuid;

  v_rahul_car_id uuid;
  v_priya_car_id uuid;
  v_aman_bike_id uuid;

  v_tomorrow date := CURRENT_DATE + INTERVAL '1 day';
BEGIN
  -- 1. Get user IDs from profiles
  SELECT id INTO v_rahul_id FROM public.profiles WHERE email = 'rahul@test.com';
  SELECT id INTO v_priya_id FROM public.profiles WHERE email = 'priya@test.com';
  SELECT id INTO v_aman_id FROM public.profiles WHERE email = 'aman@test.com';
  SELECT id INTO v_neha_id FROM public.profiles WHERE email = 'neha@test.com';
  SELECT id INTO v_admin_id FROM public.profiles WHERE email = 'admin@test.com';

  -- 2. Seed Routes & Stops
  -- Route 1: Noida-Ghaziabad to College
  SELECT id INTO v_r1_id FROM public.routes WHERE name = 'Sector 62 to Campus Express';
  IF v_r1_id IS NULL THEN
    INSERT INTO public.routes (name, is_active)
    VALUES ('Sector 62 to Campus Express', true)
    RETURNING id INTO v_r1_id;
  END IF;

  -- Route 1 Stops: Sector 62 (0) -> Indirapuram (4) -> Vaishali (7) -> College (12)
  INSERT INTO public.stops (route_id, name, stop_order, km_from_start)
  VALUES (v_r1_id, 'Sector 62', 1, 0)
  ON CONFLICT (route_id, stop_order) DO UPDATE SET name = EXCLUDED.name, km_from_start = EXCLUDED.km_from_start
  RETURNING id INTO v_s62_id;

  INSERT INTO public.stops (route_id, name, stop_order, km_from_start)
  VALUES (v_r1_id, 'Indirapuram', 2, 4)
  ON CONFLICT (route_id, stop_order) DO UPDATE SET name = EXCLUDED.name, km_from_start = EXCLUDED.km_from_start
  RETURNING id INTO v_s_indirapuram_id;

  INSERT INTO public.stops (route_id, name, stop_order, km_from_start)
  VALUES (v_r1_id, 'Vaishali', 3, 7)
  ON CONFLICT (route_id, stop_order) DO UPDATE SET name = EXCLUDED.name, km_from_start = EXCLUDED.km_from_start
  RETURNING id INTO v_s_vaishali_id;

  INSERT INTO public.stops (route_id, name, stop_order, km_from_start)
  VALUES (v_r1_id, 'College', 4, 12)
  ON CONFLICT (route_id, stop_order) DO UPDATE SET name = EXCLUDED.name, km_from_start = EXCLUDED.km_from_start
  RETURNING id INTO v_s_college1_id;

  -- Route 2: East Delhi / Link Road to College
  SELECT id INTO v_r2_id FROM public.routes WHERE name = 'Anand Vihar to Campus Corridor';
  IF v_r2_id IS NULL THEN
    INSERT INTO public.routes (name, is_active)
    VALUES ('Anand Vihar to Campus Corridor', true)
    RETURNING id INTO v_r2_id;
  END IF;

  INSERT INTO public.stops (route_id, name, stop_order, km_from_start)
  VALUES (v_r2_id, 'Anand Vihar ISBT', 1, 0)
  ON CONFLICT (route_id, stop_order) DO UPDATE SET name = EXCLUDED.name, km_from_start = EXCLUDED.km_from_start
  RETURNING id INTO v_s_anand_id;

  INSERT INTO public.stops (route_id, name, stop_order, km_from_start)
  VALUES (v_r2_id, 'Kaushambi Plaza', 2, 3)
  ON CONFLICT (route_id, stop_order) DO UPDATE SET name = EXCLUDED.name, km_from_start = EXCLUDED.km_from_start
  RETURNING id INTO v_s_kaushambi_id;

  INSERT INTO public.stops (route_id, name, stop_order, km_from_start)
  VALUES (v_r2_id, 'Mohan Nagar Chauraha', 3, 8)
  ON CONFLICT (route_id, stop_order) DO UPDATE SET name = EXCLUDED.name, km_from_start = EXCLUDED.km_from_start
  RETURNING id INTO v_s_mohan_id;

  INSERT INTO public.stops (route_id, name, stop_order, km_from_start)
  VALUES (v_r2_id, 'Engineering College Gate 2', 4, 15)
  ON CONFLICT (route_id, stop_order) DO UPDATE SET name = EXCLUDED.name, km_from_start = EXCLUDED.km_from_start
  RETURNING id INTO v_s_college2_id;

  -- 3. Driver Verifications
  IF v_rahul_id IS NOT NULL THEN
    INSERT INTO public.driver_verifications (
      user_id, college_name, roll_no, course, year, id_card_path, dl_number, dl_path, status, reviewed_by, reviewed_at
    )
    VALUES (
      v_rahul_id, 'ABES Engineering College', '210032010045', 'B.Tech CSE', '3rd',
      v_rahul_id || '/id-card.jpg', 'DL1420210045123', v_rahul_id || '/dl.jpg', 'approved', v_admin_id, now()
    )
    ON CONFLICT (user_id) DO UPDATE SET status = 'approved', reviewed_by = v_admin_id, reviewed_at = now();
  END IF;

  IF v_priya_id IS NOT NULL THEN
    INSERT INTO public.driver_verifications (
      user_id, college_name, roll_no, course, year, id_card_path, dl_number, dl_path, status, reviewed_by, reviewed_at
    )
    VALUES (
      v_priya_id, 'ABES Engineering College', '210032010068', 'B.Tech IT', '3rd',
      v_priya_id || '/id-card.jpg', 'DL1420210068456', v_priya_id || '/dl.jpg', 'approved', v_admin_id, now()
    )
    ON CONFLICT (user_id) DO UPDATE SET status = 'approved', reviewed_by = v_admin_id, reviewed_at = now();
  END IF;

  IF v_aman_id IS NOT NULL THEN
    INSERT INTO public.driver_verifications (
      user_id, college_name, roll_no, course, year, id_card_path, dl_number, dl_path, status, reviewed_by, reviewed_at
    )
    VALUES (
      v_aman_id, 'ABES Engineering College', '220032010012', 'B.Tech ECE', '2nd',
      v_aman_id || '/id-card.jpg', 'DL1420220012789', v_aman_id || '/dl.jpg', 'approved', v_admin_id, now()
    )
    ON CONFLICT (user_id) DO UPDATE SET status = 'approved', reviewed_by = v_admin_id, reviewed_at = now();
  END IF;

  IF v_neha_id IS NOT NULL THEN
    INSERT INTO public.driver_verifications (
      user_id, college_name, roll_no, course, year, id_card_path, dl_number, dl_path, status, rejection_reason
    )
    VALUES (
      v_neha_id, 'ABES Engineering College', '230032010089', 'B.Tech CSE', '1st',
      v_neha_id || '/id-card.jpg', 'DL1420230089012', v_neha_id || '/dl.jpg', 'pending', NULL
    )
    ON CONFLICT (user_id) DO UPDATE SET status = 'pending', rejection_reason = NULL;
  END IF;

  -- 4. Seed Vehicles
  -- Rahul: Car (Maruti Swift White RJ14AB1234)
  IF v_rahul_id IS NOT NULL THEN
    INSERT INTO public.vehicles (owner_id, vehicle_type, brand_model, color, plate_number, is_active)
    VALUES (v_rahul_id, 'car', 'Maruti Swift', 'White', 'RJ14AB1234', true)
    ON CONFLICT (plate_number) DO UPDATE SET brand_model = EXCLUDED.brand_model, color = EXCLUDED.color
    RETURNING id INTO v_rahul_car_id;
  END IF;

  -- Priya: Car (Hyundai i20 Grey RJ14CD1234)
  IF v_priya_id IS NOT NULL THEN
    INSERT INTO public.vehicles (owner_id, vehicle_type, brand_model, color, plate_number, is_active)
    VALUES (v_priya_id, 'car', 'Hyundai i20', 'Grey', 'RJ14CD1234', true)
    ON CONFLICT (plate_number) DO UPDATE SET brand_model = EXCLUDED.brand_model, color = EXCLUDED.color
    RETURNING id INTO v_priya_car_id;
  END IF;

  -- Aman: Bike (Honda Activa Black RJ14CD5678)
  IF v_aman_id IS NOT NULL THEN
    INSERT INTO public.vehicles (owner_id, vehicle_type, brand_model, color, plate_number, is_active)
    VALUES (v_aman_id, 'bike', 'Honda Activa', 'Black', 'RJ14CD5678', true)
    ON CONFLICT (plate_number) DO UPDATE SET brand_model = EXCLUDED.brand_model, color = EXCLUDED.color
    RETURNING id INTO v_aman_bike_id;
  END IF;

  -- 5. Seed 3 Rides dated tomorrow
  -- Clean previous demo ride requests and rides
  DELETE FROM public.ride_requests;
  DELETE FROM public.rides;

  -- Ride 1 (Rahul): 62 -> College, 08:30, 2 seats, ₹8/km
  IF v_rahul_id IS NOT NULL AND v_rahul_car_id IS NOT NULL THEN
    INSERT INTO public.rides (
      owner_id, vehicle_id, vehicle_type, route_id, start_stop_id, end_stop_id,
      ride_date, ride_time, total_seats, rate_per_km, status
    )
    VALUES (
      v_rahul_id, v_rahul_car_id, 'car', v_r1_id, v_s62_id, v_s_college1_id,
      v_tomorrow, '08:30:00', 2, 8, 'open'
    );
  END IF;

  -- Ride 2 (Priya): Vaishali -> College, 08:45, 3 seats, ₹8/km
  IF v_priya_id IS NOT NULL AND v_priya_car_id IS NOT NULL THEN
    INSERT INTO public.rides (
      owner_id, vehicle_id, vehicle_type, route_id, start_stop_id, end_stop_id,
      ride_date, ride_time, total_seats, rate_per_km, status
    )
    VALUES (
      v_priya_id, v_priya_car_id, 'car', v_r1_id, v_s_vaishali_id, v_s_college1_id,
      v_tomorrow, '08:45:00', 3, 8, 'open'
    );
  END IF;

  -- Ride 3 (Aman): Bike, Indirapuram -> College, 08:40, 1 seat, ₹3/km
  IF v_aman_id IS NOT NULL AND v_aman_bike_id IS NOT NULL THEN
    INSERT INTO public.rides (
      owner_id, vehicle_id, vehicle_type, route_id, start_stop_id, end_stop_id,
      ride_date, ride_time, total_seats, rate_per_km, status
    )
    VALUES (
      v_aman_id, v_aman_bike_id, 'bike', v_r1_id, v_s_indirapuram_id, v_s_college1_id,
      v_tomorrow, '08:40:00', 1, 3, 'open'
    );
  END IF;

END $$;
