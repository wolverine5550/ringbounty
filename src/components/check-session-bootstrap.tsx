"use client";

import { useEffect } from "react";

/**
 * Calls the session bootstrap API so `rb_anonymous_sid` is set via `Set-Cookie`
 * even when proxy timing or env gating prevented it on the first navigation.
 */
export function CheckSessionBootstrap() {
  useEffect(() => {
    void fetch("/api/session/anonymous", {
      method: "POST",
      credentials: "include",
    });
  }, []);

  return null;
}
