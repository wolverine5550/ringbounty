"use client";

import { SignOutButton } from "@/components/sign-out-button";

/** Legacy name — starter template compatibility; redirects to login after sign-out. */
export function LogoutButton() {
  return <SignOutButton redirectTo="/login" />;
}
