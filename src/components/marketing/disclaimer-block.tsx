import { DisclaimerBanner } from "@/components/marketing/disclaimer-banner";

type DisclaimerBlockProps = {
  className?: string;
};

/** Bordered PRD §3 disclaimer aside (§3.2.3 / §3.6). */
export function DisclaimerBlock({ className }: DisclaimerBlockProps) {
  return <DisclaimerBanner variant="block" className={className} />;
}
