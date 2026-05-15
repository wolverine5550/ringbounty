import { PRODUCT_DISCLAIMER } from "@/lib/marketing/constants";
import { cn } from "@/lib/utils";

export type DisclaimerBannerVariant = "banner" | "block" | "footer";

type DisclaimerBannerProps = {
  /** `banner` — slim strip; `block` — bordered aside; `footer` — site chrome. */
  variant?: DisclaimerBannerVariant;
  className?: string;
};

const variantClassName: Record<DisclaimerBannerVariant, string> = {
  banner:
    "border-y border-border bg-muted/30 px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground",
  block:
    "rounded-lg border border-border bg-muted/40 px-4 py-4 text-sm leading-relaxed text-muted-foreground",
  footer:
    "text-muted-foreground text-xs leading-relaxed text-center",
};

/**
 * PRD §3 exact disclaimer (Phase §3.6). Wording states we do **not** provide legal advice —
 * never framed as an offering of legal advice.
 */
export function DisclaimerBanner({
  variant = "banner",
  className,
}: DisclaimerBannerProps) {
  return (
    <aside
      className={cn(variantClassName[variant], className)}
      role="note"
      aria-label="Important information"
    >
      {PRODUCT_DISCLAIMER}
    </aside>
  );
}
