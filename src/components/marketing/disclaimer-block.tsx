import { PRODUCT_DISCLAIMER } from "@/lib/marketing/constants";

/** PRD §3 disclaimer block for mid-page or bottom placement (§3.2.3). */
export function DisclaimerBlock() {
  return (
    <aside
      className="rounded-lg border border-border bg-muted/40 px-4 py-4 text-sm leading-relaxed text-muted-foreground"
      role="note"
      aria-label="Important information"
    >
      {PRODUCT_DISCLAIMER}
    </aside>
  );
}
