-- 0001_create_tables.sql
-- Create core tables for Campus Carpool Matcher

-- 1. profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. driver_verifications
CREATE TABLE public.driver_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  college_name text NOT NULL,
  roll_no text NOT NULL,
  course text NOT NULL,
  year text NOT NULL,
  id_card_path text NOT NULL,
  dl_number text NOT NULL,
  dl_path text NOT NULL,
  selfie_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz
);

-- 3. vehicles
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('car', 'bike')),
  brand_model text NOT NULL,
  color text NOT NULL,
  plate_number text NOT NULL UNIQUE CHECK (plate_number ~ '^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$'),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. routes
CREATE TABLE public.routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

-- 5. stops
CREATE TABLE public.stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  name text NOT NULL,
  stop_order int NOT NULL,
  km_from_start numeric NOT NULL CHECK (km_from_start >= 0),
  UNIQUE(route_id, stop_order)
);

-- 6. rides
CREATE TABLE public.rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('car', 'bike')),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE RESTRICT,
  start_stop_id uuid NOT NULL REFERENCES public.stops(id) ON DELETE RESTRICT,
  end_stop_id uuid NOT NULL REFERENCES public.stops(id) ON DELETE RESTRICT,
  ride_date date NOT NULL,
  ride_time time NOT NULL,
  total_seats int NOT NULL,
  rate_per_km numeric NOT NULL CHECK (rate_per_km >= 1 AND rate_per_km <= 50),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'cancelled', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_stop_id <> end_stop_id),
  CHECK ((vehicle_type = 'bike' AND total_seats = 1) OR (vehicle_type = 'car' AND total_seats BETWEEN 1 AND 3))
);

-- 7. ride_requests
CREATE TABLE public.ride_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  rider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pickup_stop_id uuid NOT NULL REFERENCES public.stops(id) ON DELETE RESTRICT,
  drop_stop_id uuid NOT NULL REFERENCES public.stops(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected', 'Cancelled')),
  reject_reason text,
  fare_estimate numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ride_id, rider_id)
);

-- 8. audit_logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
