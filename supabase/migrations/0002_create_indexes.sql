-- 0002_create_indexes.sql
-- Create performance indexes from TECH.md

CREATE INDEX idx_rides_route_date      ON public.rides (route_id, ride_date, ride_time);
CREATE INDEX idx_rides_owner           ON public.rides (owner_id);
CREATE INDEX idx_requests_ride_status  ON public.ride_requests (ride_id, status);
CREATE INDEX idx_requests_rider        ON public.ride_requests (rider_id);
CREATE INDEX idx_stops_route_order     ON public.stops (route_id, stop_order);
CREATE INDEX idx_vehicles_owner        ON public.vehicles (owner_id);
CREATE INDEX idx_verifications_status  ON public.driver_verifications (status, submitted_at);
