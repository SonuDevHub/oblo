"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function AccessDeniedToast() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const hasShown = React.useRef(false);

  React.useEffect(() => {
    if (error === "access_denied" && !hasShown.current) {
      toast.error("Access denied: Admin privileges required");
      hasShown.current = true;
    }
  }, [error]);

  return null;
}
