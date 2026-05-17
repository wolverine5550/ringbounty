import Link from "next/link";

import { FIRM_PORTAL_HOME_PATH } from "@/lib/firms/firm-portal-host";

/** Stripe Connect return URL (§13.3 / §13.4). */
export default function FirmStripeOnboardingCompletePage() {
  return (
    <section className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-medium">Stripe onboarding submitted</h2>
      <p className="text-sm text-muted-foreground">
        We will update your payout status when Stripe finishes reviewing your
        account. You can return to the lead inbox while that processes.
      </p>
      <Link href={FIRM_PORTAL_HOME_PATH} className="text-sm underline">
        Back to leads
      </Link>
    </section>
  );
}
