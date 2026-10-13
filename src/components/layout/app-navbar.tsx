"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Search,
  PlusCircle,
  Car,
  Inbox,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/actions/auth-actions";
import { toast } from "sonner";

interface AppNavbarProps {
  userEmail?: string;
  userName?: string;
  role?: string;
  isBlocked?: boolean;
}

export function AppNavbar({
  userEmail,
  userName,
  role,
  isBlocked,
}: AppNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const navLinks = [
    { href: "/rides/search", label: "Search", icon: Search },
    { href: "/rides/new", label: "Offer Ride", icon: PlusCircle },
    { href: "/rides/mine", label: "My Rides", icon: Car },
    { href: "/requests/mine", label: "My Requests", icon: Inbox },
    { href: "/vehicles", label: "Vehicles", icon: Car },
    { href: "/verification", label: "Verification", icon: ShieldCheck },
  ];

  if (role === "admin") {
    navLinks.push({ href: "/admin", label: "Admin", icon: ShieldAlert });
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      const res = await signOutAction();
      toast.success("Logged out successfully");
      router.push(res.redirectTo || "/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      {/* Blocked user banner */}
      {isBlocked && (
        <div className="bg-rejected/15 border-b border-rejected/30 px-4 py-2 text-center text-xs text-rejected font-medium flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>Aapka account block hai, admin se contact karein</span>
        </div>
      )}

      {/* Desktop Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/rides/search" className="flex items-center gap-2">
            <Image
              src="/brand/oblo-logo-dark.svg"
              alt="Oblo Rides"
              width={110}
              height={28}
              priority
            />
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "text-lime font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-3"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-md bg-lime/10 border border-lime/30 -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User actions */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 pl-3 border-l border-border text-xs text-muted-foreground">
              <div className="size-8 rounded-full bg-surface-3 border border-border flex items-center justify-center font-bold text-foreground">
                {userName ? userName.charAt(0).toUpperCase() : <User className="size-4" />}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-foreground truncate max-w-[120px]">
                  {userName || userEmail?.split("@")[0]}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize">
                  {role || "student"}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="text-muted-foreground hover:text-rejected hover:bg-rejected/10 ml-1"
              title="Sign Out"
            >
              <LogOut className="size-4 mr-1" />
              <span>Logout</span>
            </Button>
          </div>

          {/* Mobile menu hamburger toggle */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-foreground"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown drawer */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border bg-surface-1 px-4 py-4 space-y-2"
          >
            <div className="pb-3 border-b border-border mb-2 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <span className="px-2 py-0.5 rounded-pill bg-lime/10 border border-lime/30 text-[10px] text-lime font-bold uppercase">
                {role}
              </span>
            </div>

            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? "bg-lime/10 text-lime border border-lime/30"
                      : "text-muted-foreground hover:bg-surface-3 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-border mt-3">
              <Button
                variant="destructive"
                className="w-full justify-start text-sm"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                <LogOut className="size-4 mr-2" />
                <span>Logout</span>
              </Button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (< md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-1/95 backdrop-blur-lg border-t border-border px-2 py-1.5 flex items-center justify-around safe-bottom">
        <Link
          href="/rides/search"
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium ${
            pathname.startsWith("/rides/search") ? "text-lime" : "text-muted-foreground"
          }`}
        >
          <Search className="size-4" />
          <span>Search</span>
        </Link>

        <Link
          href="/rides/mine"
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium ${
            pathname === "/rides/mine" ? "text-lime" : "text-muted-foreground"
          }`}
        >
          <Car className="size-4" />
          <span>My Rides</span>
        </Link>

        {/* Center Offer FAB */}
        <Link
          href="/rides/new"
          className="size-12 -mt-5 rounded-full bg-lime text-ink flex items-center justify-center shadow-lg hover:bg-lime-hover active:bg-lime-press transition-transform active:scale-95"
          title="Offer Ride"
        >
          <PlusCircle className="size-6" />
        </Link>

        <Link
          href="/requests/mine"
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium ${
            pathname === "/requests/mine" ? "text-lime" : "text-muted-foreground"
          }`}
        >
          <Inbox className="size-4" />
          <span>Requests</span>
        </Link>

        <Link
          href="/verification"
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium ${
            pathname === "/verification" ? "text-lime" : "text-muted-foreground"
          }`}
        >
          <ShieldCheck className="size-4" />
          <span>Verify</span>
        </Link>
      </nav>
    </>
  );
}
