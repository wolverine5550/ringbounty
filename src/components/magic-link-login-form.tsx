"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

type MagicLinkLoginFormProps = {
  /** Post-auth in-app path (must start with `/`). */
  redirectNext?: string;
} & React.ComponentPropsWithoutRef<"div">;

/**
 * Passwordless email sign-in. Uses `signInWithOtp` (magic link) and
 * `emailRedirectTo` → `/auth/callback` for PKCE code exchange on the server.
 */
export function MagicLinkLoginForm({
  className,
  redirectNext = "/protected",
  ...props
}: MagicLinkLoginFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfo(null);

    const supabase = createClient();
    const nextParam = redirectNext.startsWith("/") ? redirectNext : "/protected";
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextParam)}`;

    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo,
          shouldCreateUser: true,
        },
      });
      if (signInError) throw signInError;
      setInfo(
        "Check your email for the sign-in link. Open it in this same browser tab — switching browsers or devices will fail.",
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign in with email</CardTitle>
          <CardDescription>
            We&apos;ll email you a one-time link — no password required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="magic-email">Email</Label>
              <Input
                id="magic-email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending link…" : "Send magic link"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Prefer a password?{" "}
              <Link
                href="/auth/login"
                className="underline underline-offset-4"
              >
                Sign in with password
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
