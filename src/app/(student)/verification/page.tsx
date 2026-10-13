import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/create-server-client";
import { PageHeader } from "@/components/layout/page-header";
import { VerificationStatusBanner, type VerificationStatus } from "@/components/verification/verification-status-banner";
import { DriverVerificationForm } from "@/components/verification/driver-verification-form";
import { VerifiedDriverBadge } from "@/components/verification/verified-driver-badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function VerificationPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/verification");
  }

  // Fetch driver verification row
  const { data: verifications } = await supabase
    .from("driver_verifications")
    .select("id, status, roll_no, dl_number, rejection_reason, submitted_at, reviewed_at")
    .eq("user_id", user.id)
    .order("submitted_at", { ascending: false })
    .limit(1);

  const verification = verifications?.[0];
  const status: VerificationStatus = (verification?.status as VerificationStatus) || "not_submitted";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver Verification"
        description="Verify your college credentials to start offering carpool rides to fellow students"
        action={status === "approved" ? <VerifiedDriverBadge /> : undefined}
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <VerificationStatusBanner
          status={status}
          rejectionReason={verification?.rejection_reason}
          showCta={false}
        />

        {status === "approved" && verification && (
          <Card className="bg-card border-border">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-surface-2 border border-border">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">College ID</p>
                  <p className="font-mono font-medium text-foreground">{verification.roll_no}</p>
                </div>
                <div className="p-3 rounded-lg bg-surface-2 border border-border">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Driving License</p>
                  <p className="font-mono font-medium text-foreground">{verification.dl_number}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Verified on {verification.reviewed_at ? new Date(verification.reviewed_at).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "recently"}.
              </p>
            </CardContent>
          </Card>
        )}

        {status === "pending" && (
          <Card className="bg-card border-border">
            <CardContent className="pt-6 space-y-3 text-sm">
              <p className="text-muted-foreground">
                Aapke documents admin verification queue mein hain. Verification hone ke baad aap instant rides offer kar sakenge.
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded bg-surface-3">
                  <span className="text-muted-foreground">College ID:</span>{" "}
                  <span className="font-mono text-foreground">{verification?.roll_no}</span>
                </div>
                <div className="p-2.5 rounded bg-surface-3">
                  <span className="text-muted-foreground">DL:</span>{" "}
                  <span className="font-mono text-foreground">{verification?.dl_number}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(status === "not_submitted" || status === "rejected") && (
          <DriverVerificationForm
            userId={user.id}
            initialCollegeIdNumber={verification?.roll_no || ""}
            initialDlNumber={verification?.dl_number || ""}
          />
        )}
      </div>
    </div>
  );
}
