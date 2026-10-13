"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, X, Loader2, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminReviewVerificationAction } from "@/actions/verification-actions";

interface VerificationReviewCardProps {
  id: string;
  studentName: string;
  studentEmail: string;
  collegeIdNumber: string;
  dlNumber: string;
  collegeIdUrl: string;
  dlUrl: string;
  status: string;
  createdAt: string;
  rejectionReason?: string | null;
}

export function VerificationReviewCard({
  id,
  studentName,
  studentEmail,
  collegeIdNumber,
  dlNumber,
  collegeIdUrl,
  dlUrl,
  status,
  createdAt,
  rejectionReason,
}: VerificationReviewCardProps) {
  const [isPending, setIsPending] = React.useState(false);
  const [rejectMode, setRejectMode] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const handleReview = async (action: "approve" | "reject") => {
    if (action === "reject" && !reason.trim()) {
      toast.error("Rejection ka reason daalna zaroori hai");
      return;
    }

    setIsPending(true);
    try {
      const res = await adminReviewVerificationAction(id, action, reason.trim());
      if (!res.success) {
        throw new Error(res.error);
      }
      toast.success(res.message);
      setRejectMode(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Kuch galat hua";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="bg-card border-border shadow-card">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h4 className="font-semibold text-foreground text-base">{studentName}</h4>
            <p className="text-xs text-muted-foreground">{studentEmail} · Submitted {new Date(createdAt).toLocaleDateString("en-IN")}</p>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider self-start sm:self-auto ${
              status === "approved"
                ? "bg-lime/15 text-lime border border-lime/30"
                : status === "rejected"
                ? "bg-status-rejected/15 text-status-rejected border border-status-rejected/30"
                : "bg-status-pending/15 text-status-pending border border-status-pending/30"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded bg-surface-2 border border-border">
            <span className="text-muted-foreground block mb-0.5">College ID:</span>
            <span className="font-mono text-foreground font-medium">{collegeIdNumber}</span>
            <div className="mt-1.5 flex items-center gap-1.5 text-lime text-[11px]">
              <FileText className="size-3.5" />
              <span className="truncate">{collegeIdUrl}</span>
            </div>
          </div>
          <div className="p-2.5 rounded bg-surface-2 border border-border">
            <span className="text-muted-foreground block mb-0.5">Driving License:</span>
            <span className="font-mono text-foreground font-medium">{dlNumber}</span>
            <div className="mt-1.5 flex items-center gap-1.5 text-lime text-[11px]">
              <FileText className="size-3.5" />
              <span className="truncate">{dlUrl}</span>
            </div>
          </div>
        </div>

        {rejectionReason && (
          <p className="text-xs text-status-rejected bg-status-rejected/10 p-2 rounded border border-status-rejected/20">
            Rejection reason: {rejectionReason}
          </p>
        )}

        {status === "pending" && (
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-end">
            {!rejectMode ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setRejectMode(true)}
                  className="border-status-rejected/40 text-status-rejected hover:bg-status-rejected/10"
                >
                  <X className="size-3.5 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleReview("approve")}
                  className="bg-lime text-ink hover:bg-lime-hover font-semibold"
                >
                  {isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Check className="size-3.5 mr-1" />}
                  Approve Verification
                </Button>
              </>
            ) : (
              <div className="w-full flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Rejection reason daalein (e.g. ID blur hai)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isPending}
                  className="bg-surface-3 border-border text-xs h-9 focus:border-status-rejected"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => handleReview("reject")}
                    className="h-9"
                  >
                    Confirm Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => {
                      setRejectMode(false);
                      setReason("");
                    }}
                    className="h-9"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
