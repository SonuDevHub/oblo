import React from "react";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background">
      {/* Left branding panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-surface-1 border-r border-border relative overflow-hidden bg-road-grid">
        <div className="z-10">
          <Image
            src="/brand/oblo-logo-dark.svg"
            alt="Oblo Rides"
            width={140}
            height={36}
            priority
          />
        </div>

        <div className="z-10 my-auto py-12 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-lime/10 border border-lime/30 text-lime text-xs font-semibold mb-6">
            <span className="size-2 rounded-full bg-lime animate-pulse" />
            Campus Carpool Matcher
          </div>
          <h1 className="text-4xl font-display font-bold leading-tight text-foreground tracking-tight mb-4">
            Same route, <br />
            same college, <br />
            <span className="text-highlight">split by km.</span>
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Ride sharing exclusively for college students. Travel together with verified campus mates and split costs fair and square.
          </p>

          {/* Schematic visual */}
          <div className="p-4 rounded-xl bg-surface-2 border border-border">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-2">
              <span>Sector 62 (0 km)</span>
              <span>Vaishali (7 km)</span>
              <span>College (12 km)</span>
            </div>
            <div className="relative h-2 bg-surface-3 rounded-full overflow-hidden flex items-center">
              <div className="absolute left-0 w-7/12 h-full bg-lime" />
              <div className="absolute left-0 size-3 rounded-full bg-lime ring-2 ring-background -ml-1" />
              <div className="absolute left-7/12 size-3 rounded-full bg-lime ring-2 ring-background -ml-1 glow-lime" />
              <div className="absolute right-0 size-3 rounded-full bg-n-500 ring-2 ring-background -mr-1" />
            </div>
            <div className="flex justify-between items-center mt-3 text-xs">
              <span className="text-lime font-medium">Your stretch: ₹17</span>
              <span className="text-muted-foreground font-mono">₹8 / km split</span>
            </div>
          </div>
        </div>

        <div className="z-10 text-xs text-muted-foreground">
          Team Jugaad Junction · Campus Hackathon Project
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Image
              src="/brand/oblo-logo-dark.svg"
              alt="Oblo Rides"
              width={130}
              height={32}
              priority
            />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
