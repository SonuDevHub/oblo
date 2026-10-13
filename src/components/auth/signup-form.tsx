"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signUpAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (phone && !/^[0-9]{10}$/.test(phone)) {
      toast.error("Phone must be exactly 10 digits");
      return;
    }

    setIsPending(true);
    try {
      const res = await signUpAction({
        fullName,
        email,
        password,
        phone: phone || undefined,
      });

      if (!res.success) {
        toast.error(res.error || "Signup failed");
      } else {
        toast.success("Account created successfully!");
        router.push(res.redirectTo || "/rides/search");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong, please try again");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-2xl font-bold font-display text-foreground">
          Create an account
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Apne college carpool group se judein
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Full Name</Label>
            <Input
              id="signup-name"
              type="text"
              placeholder="Aman Gupta"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isPending}
              required
              maxLength={60}
              className="bg-surface-3 border-border focus:border-lime"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">College Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="aman@test.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              required
              autoComplete="email"
              className="bg-surface-3 border-border focus:border-lime"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Password (min 8 chars)</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              required
              minLength={8}
              autoComplete="new-password"
              className="bg-surface-3 border-border focus:border-lime"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-phone">
              Phone Number <span className="text-n-400 font-normal lowercase">(optional)</span>
            </Label>
            <Input
              id="signup-phone"
              type="tel"
              placeholder="9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isPending}
              maxLength={10}
              className="bg-surface-3 border-border focus:border-lime"
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-lime text-ink hover:bg-lime-hover active:bg-lime-press font-semibold h-11"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-2">
            Pehle se account hai?{" "}
            <Link
              href="/login"
              className="text-lime hover:underline font-medium"
            >
              Login karein
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
