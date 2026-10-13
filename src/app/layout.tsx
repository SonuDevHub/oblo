import type { Metadata } from "next";
import { Sora, Manrope, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MotionProvider } from "@/components/providers/motion-provider";
import { AppPreloader } from "@/components/skiper/app-preloader";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oblo Rides — Same route, same college, split by km",
  description:
    "Campus carpool matcher for college students. Fast, safe, verified ride sharing with fair per-km cost split.",
  icons: {
    icon: "/brand/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${sora.variable} ${manrope.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-lime selection:text-ink">
        <MotionProvider>
          <TooltipProvider>
            <AppPreloader />
            {children}
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
