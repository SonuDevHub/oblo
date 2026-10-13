-- 0009_create_verification_functions.sql
-- Verification RPC functions for drivers and admin

-- Helper to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_blocked = false
  );
$$;

-- 1. Submit driver verification (Student)
CREATE OR REPLACE FUNCTION public.submit_driver_verification(
  p_college_name text,
  p_roll_no text,
  p_course text,
  p_year text,
  p_id_card_path text,
  p_dl_number text,
  p_dl_path text,
  p_selfie_path text DEFAULT NULL
)
RETURNS public.driver_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing public.driver_verifications;
  v_res public.driver_verifications;
  v_is_blocked boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT is_blocked INTO v_is_blocked FROM public.profiles WHERE id = v_user_id;
  IF v_is_blocked IS TRUE THEN
    RAISE EXCEPTION 'Aapka account block hai, admin se contact karein';
  END IF;

  SELECT * INTO v_existing FROM public.driver_verifications WHERE user_id = v_user_id;
  IF v_existing.id IS NOT NULL AND v_existing.status = 'approved' THEN
    RAISE EXCEPTION 'Aapka verification pehle se approved hai';
  END IF;

  INSERT INTO public.driver_verifications (
    user_id,
    college_name,
    roll_no,
    course,
    year,
    id_card_path,
    dl_number,
    dl_path,
    selfie_path,
    status,
    rejection_reason,
    submitted_at,
    reviewed_by,
    reviewed_at
  )
  VALUES (
    v_user_id,
    p_college_name,
    p_roll_no,
    p_course,
    p_year,
    p_id_card_path,
    p_dl_number,
    p_dl_path,
    p_selfie_path,
    'pending',
    NULL,
    now(),
    NULL,
    NULL
  )
  ON CONFLICT (user_id) DO UPDATE SET
    college_name = EXCLUDED.college_name,
    roll_no = EXCLUDED.roll_no,
    course = EXCLUDED.course,
    year = EXCLUDED.year,
    id_card_path = EXCLUDED.id_card_path,
    dl_number = EXCLUDED.dl_number,
    dl_path = EXCLUDED.dl_path,
    selfie_path = EXCLUDED.selfie_path,
    status = 'pending',
    rejection_reason = NULL,
    submitted_at = now(),
    reviewed_by = NULL,
    reviewed_at = NULL
  RETURNING * INTO v_res;

  RETURN v_res;
END;
$$;

-- 2. Get my verification (Student)
CREATE OR REPLACE FUNCTION public.get_my_verification()
RETURNS SETOF public.driver_verifications
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.driver_verifications
  WHERE user_id = auth.uid();
$$;

-- 3. Review driver verification (Admin)
CREATE OR REPLACE FUNCTION public.admin_review_verification(
  p_verification_id uuid,
  p_approve boolean,
  p_reason text DEFAULT NULL
)
RETURNS public.driver_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_res public.driver_verifications;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  UPDATE public.driver_verifications
  SET
    status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
    rejection_reason = CASE WHEN p_approve THEN NULL ELSE p_reason END,
    reviewed_by = v_admin_id,
    reviewed_at = now()
  WHERE id = p_verification_id
  RETURNING * INTO v_res;

  IF v_res.id IS NULL THEN
    RAISE EXCEPTION 'Verification record not found';
  END IF;

  -- Audit log
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    v_admin_id,
    CASE WHEN p_approve THEN 'approve_verification' ELSE 'reject_verification' END,
    'driver_verifications',
    p_verification_id::text,
    jsonb_build_object('approved', p_approve, 'reason', p_reason, 'user_id', v_res.user_id)
  );

  RETURN v_res;
END;
$$;

-- 4. Revoke driver verification (Admin)
CREATE OR REPLACE FUNCTION public.admin_revoke_driver(
  p_user_id uuid,
  p_reason text
)
RETURNS public.driver_verifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_res public.driver_verifications;
  v_open_ride RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin only';
  END IF;

  UPDATE public.driver_verifications
  SET
    status = 'rejected',
    rejection_reason = p_reason,
    reviewed_by = v_admin_id,
    reviewed_at = now()
  WHERE user_id = p_user_id
  RETURNING * INTO v_res;

  -- Cancel all open rides of this driver
  FOR v_open_ride IN
    SELECT id FROM public.rides WHERE owner_id = p_user_id AND status = 'open'
  LOOP
    UPDATE public.rides SET status = 'cancelled' WHERE id = v_open_ride.id;
    -- Auto-reject pending and accepted requests for this cancelled ride
    UPDATE public.ride_requests
    SET status = 'Rejected',
        reject_reason = 'Driver verification revoked: ' || p_reason,
        updated_at = now()
    WHERE ride_id = v_open_ride.id AND status IN ('Pending', 'Accepted');
  END LOOP;

  -- Audit log
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, meta)
  VALUES (
    v_admin_id,
    'revoke_driver_verification',
    'driver_verifications',
    COALESCE(v_res.id::text, p_user_id::text),
    jsonb_build_object('user_id', p_user_id, 'reason', p_reason)
  );

  RETURN v_res;
END;
$$;
