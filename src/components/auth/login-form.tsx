"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signInAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Invalid email or password");
      return;
    }

    setIsPending(true);
    try {
      const res = await signInAction({ email, password });
      if (!res.success) {
        toast.error(res.error || "Invalid email or password");
      } else {
        toast.success("Login successful!");
        router.push(res.redirectTo || "/rides/search");
        router.refresh();
      }
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="bg-card border-border shadow-card">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-2xl font-bold font-display text-foreground">
          Welcome back
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Apne college account se login karein
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">College Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="rahul@test.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              required
              autoComplete="email"
              className="bg-surface-3 border-border focus:border-lime"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Password</Label>
            </div>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              required
              autoComplete="current-password"
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
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-2">
            Naye ho?{" "}
            <Link
              href="/signup"
              className="text-lime hover:underline font-medium"
            >
              Account banayein
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
