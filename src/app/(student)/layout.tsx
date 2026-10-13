import React from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/create-server-client";
import { AppNavbar } from "@/components/layout/app-navbar";

export default async function StudentLayout({
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
    .select("full_name, email, role, is_blocked")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground pb-16 md:pb-0">
      <AppNavbar
        userEmail={user.email}
        userName={profile?.full_name ?? undefined}
        role={profile?.role ?? "student"}
        isBlocked={profile?.is_blocked ?? false}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      <footer className="border-t border-border py-6 px-4 text-center text-xs text-muted-foreground mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Oblo Rides · Team Jugaad Junction</p>
          <p className="font-mono text-[11px] text-n-400">
            UI components: Skiper UI & shadcn/ui
          </p>
        </div>
      </footer>
    </div>
  );
}
