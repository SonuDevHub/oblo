import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/create-server-client";
import { PageHeader } from "@/components/layout/page-header";
import { VerificationReviewCard } from "@/components/admin/verification-review-card";

export const dynamic = "force-dynamic";

interface VerificationItem {
  id: string;
  user_id: string;
  status: string;
  roll_no: string;
  id_card_path: string;
  dl_number: string;
  dl_path: string;
  rejection_reason: string | null;
  submitted_at: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

export default async function AdminVerificationsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin/verifications");
  }

  // Fetch verifications with profiles
  const { data: rawVerifications } = await supabase
    .from("driver_verifications")
    .select(`
      id,
      user_id,
      status,
      roll_no,
      id_card_path,
      dl_number,
      dl_path,
      rejection_reason,
      submitted_at,
      profiles (
        full_name,
        email
      )
    `)
    .order("submitted_at", { ascending: false });

  const verifications = (rawVerifications || []) as unknown as VerificationItem[];
  const pending = verifications.filter((v) => v.status === "pending");
  const processed = verifications.filter((v) => v.status !== "pending");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver Verifications"
        description="Review student ID cards and driving licenses to grant ride offering permissions"
      />

      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold font-display text-foreground">Pending Queue</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-status-pending/20 text-status-pending">
              {pending.length}
            </span>
          </div>

          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 rounded-lg bg-surface-2 border border-border text-center">
              Abhi koi pending driver verification nahi hai.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pending.map((v) => (
                <VerificationReviewCard
                  key={v.id}
                  id={v.id}
                  studentName={v.profiles?.full_name || "Student"}
                  studentEmail={v.profiles?.email || ""}
                  collegeIdNumber={v.roll_no}
                  dlNumber={v.dl_number}
                  collegeIdUrl={v.id_card_path}
                  dlUrl={v.dl_path}
                  status={v.status}
                  createdAt={v.submitted_at}
                  rejectionReason={v.rejection_reason}
                />
              ))}
            </div>
          )}
        </div>

        {processed.length > 0 && (
          <div>
            <h3 className="text-lg font-bold font-display text-foreground mb-4">Past Verifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processed.map((v) => (
                <VerificationReviewCard
                  key={v.id}
                  id={v.id}
                  studentName={v.profiles?.full_name || "Student"}
                  studentEmail={v.profiles?.email || ""}
                  collegeIdNumber={v.roll_no}
                  dlNumber={v.dl_number}
                  collegeIdUrl={v.id_card_path}
                  dlUrl={v.dl_path}
                  status={v.status}
                  createdAt={v.submitted_at}
                  rejectionReason={v.rejection_reason}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
