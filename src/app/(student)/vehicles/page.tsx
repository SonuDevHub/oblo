import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/create-server-client";
import { PageHeader } from "@/components/layout/page-header";
import { VehicleCard, type VehicleData } from "@/components/vehicles/vehicle-card";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { VerificationStatusBanner, type VerificationStatus } from "@/components/verification/verification-status-banner";
import { Car } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/vehicles");
  }

  // 1. Fetch user's vehicles
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, owner_id, vehicle_type, brand_model, color, plate_number")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // 2. Fetch driver verification status
  const { data: verifications } = await supabase
    .from("driver_verifications")
    .select("status, rejection_reason")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(1);

  const verification = verifications?.[0];
  const verificationStatus: VerificationStatus =
    (verification?.status as VerificationStatus) || "not_submitted";

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Vehicles"
        description="Manage your registered cars and bikes for offering carpools"
        action={<VehicleForm />}
      />

      {/* Verification status reminder if not approved */}
      {verificationStatus !== "approved" && (
        <VerificationStatusBanner
          status={verificationStatus}
          rejectionReason={verification?.rejection_reason}
        />
      )}

      {/* Vehicles Grid */}
      {(!vehicles || vehicles.length === 0) ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-card border border-border">
          <div className="size-16 rounded-full bg-surface-2 flex items-center justify-center text-muted-foreground mb-4">
            <Car className="size-8" />
          </div>
          <h3 className="text-lg font-bold font-display text-foreground mb-1">
            Koi gaadi registered nahi hai
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Ride dene ke liye apni car ya bike add karein. Passenger seats automatically calculate ho jayengi.
          </p>
          <VehicleForm />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v as VehicleData} />
          ))}
        </div>
      )}
    </div>
  );
}
