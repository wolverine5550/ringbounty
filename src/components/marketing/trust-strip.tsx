import { TRUST_STRIP_LINE } from "@/lib/marketing/constants";

/** One-line trust signals below the landing hero (§3.1.3). */
export function TrustStrip() {
  return (
    <p
      className="text-muted-foreground border-y border-border bg-muted/30 px-4 py-3 text-center text-xs sm:text-sm"
      role="note"
    >
      {TRUST_STRIP_LINE}
    </p>
  );
}
