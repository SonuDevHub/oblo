"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Car,
  Calendar,
  Inbox,
  MapPin,
  FileText,
  ArrowLeft,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/actions/auth-actions";
import { toast } from "sonner";

export function AdminSidebar({
  adminName,
  adminEmail,
}: {
  adminName?: string;
  adminEmail?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/verifications", label: "Verifications", icon: ShieldCheck },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/vehicles", label: "Vehicles", icon: Car },
    { href: "/admin/rides", label: "Rides", icon: Calendar },
    { href: "/admin/requests", label: "Requests", icon: Inbox },
    { href: "/admin/routes", label: "Routes & Stops", icon: MapPin },
    { href: "/admin/audit", label: "Audit Log", icon: FileText },
  ];

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const res = await signOutAction();
      toast.success("Logged out");
      router.push(res.redirectTo || "/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <aside className="w-64 border-r border-border bg-surface-1 flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Header / Logo */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/brand/oblo-logo-dark.svg"
              alt="Oblo Rides"
              width={110}
              height={28}
              priority
            />
          </Link>
          <span className="px-2 py-0.5 rounded-pill bg-lime/10 border border-lime/30 text-[10px] text-lime font-bold uppercase">
            Admin
          </span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-lime font-semibold border-l-2 border-lime"
                    : "text-muted-foreground hover:bg-surface-3 hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        <Link
          href="/rides/search"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-lime px-2 py-1 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Switch to Student Portal</span>
        </Link>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="truncate">
            <p className="text-xs font-semibold text-foreground truncate">
              {adminName || "System Admin"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">{adminEmail}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="size-8 text-muted-foreground hover:text-rejected"
            title="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
