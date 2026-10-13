import React from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/create-server-client";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/rides/search?error=access_denied");
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <AdminSidebar
        adminName={profile?.full_name ?? undefined}
        adminEmail={user.email}
      />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
