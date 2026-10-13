import { redirect } from "next/navigation";
import Link from "next/link";
import { Car } from "lucide-react";
import { createServerClient } from "@/lib/supabase/create-server-client";
import { PageHeader } from "@/components/layout/page-header";
import { RideOfferForm, type RouteWithStops } from "@/components/rides/ride-offer-form";
import { VerificationStatusBanner, type VerificationStatus } from "@/components/verification/verification-status-banner";
import { type VehicleData } from "@/components/vehicles/vehicle-card";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_MESSAGES } from "@/lib/constants/app-messages";

export const dynamic = "force-dynamic";

export default async function OfferRidePage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/rides/new");
  }

  // 1. Check driver verification status
  const { data: verifications } = await supabase
    .from("driver_verifications")
    .select("status, rejection_reason")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(1);

  const verification = verifications?.[0];
  const verificationStatus: VerificationStatus =
    (verification?.status as VerificationStatus) || "not_submitted";

  // 2. Fetch user's vehicles
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, owner_id, vehicle_type, brand_model, color, plate_number")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // 3. Fetch active routes with stops
  const { data: routes } = await supabase
    .from("routes")
    .select(`
      id,
      name,
      stops (
        id,
        name,
        stop_order,
        km_from_start
      )
    `)
    .eq("is_active", true)
    .order("name", { ascending: true });

  const isVerified = verificationStatus === "approved";
  const hasVehicles = vehicles && vehicles.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Offer a Ride"
        description="Daily campus commute mein khali seats share karein aur travel cost split karein"
      />

      {/* Case 1: Driver not approved -> Show verification banner instead of form */}
      {!isVerified ? (
        <div className="max-w-2xl mx-auto space-y-4 pt-4">
          <VerificationStatusBanner
            status={verificationStatus}
            rejectionReason={verification?.rejection_reason}
            showCta={true}
          />
        </div>
      ) : !hasVehicles ? (
        /* Case 2: Verified, but no vehicles registered -> CTA to add vehicle */
        <Card className="max-w-xl mx-auto bg-card border-border shadow-card text-center p-8">
          <CardContent className="space-y-4 pt-4">
            <div className="size-14 rounded-full bg-surface-2 flex items-center justify-center text-muted-foreground mx-auto">
              <Car className="size-7 text-lime" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-foreground">
                {APP_MESSAGES.NO_VEHICLE}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Ride post karne se pehle apni car ya bike register karein taaki riders ko vehicle details mil sakein.
              </p>
            </div>
            <Link
              href="/vehicles"
              className={buttonVariants({
                className: "bg-lime text-ink hover:bg-lime-hover font-semibold",
              })}
            >
              Go to Vehicles
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Case 3: Verified with vehicles -> Render the offer ride form */
        <RideOfferForm
          vehicles={vehicles as unknown as VehicleData[]}
          routes={(routes || []) as unknown as RouteWithStops[]}
        />
      )}
    </div>
  );
}
