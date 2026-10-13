import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background text-foreground">
      <div className="size-16 rounded-full bg-lime/10 border border-lime/30 text-lime flex items-center justify-center text-2xl font-bold mb-4">
        404
      </div>
      <h1 className="text-2xl font-display font-bold mb-2">Page nahi mila</h1>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        Yeh rasta galat hai ya page delete ho chuka hai. Wapas campus search pe chalein?
      </p>
      <Link href="/rides/search">
        <Button className="bg-lime text-ink hover:bg-lime-hover font-semibold">
          Return to Rides
        </Button>
      </Link>
    </div>
  );
}
