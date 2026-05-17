import { FirmStripeOnboardingButton } from "@/components/firms/firm-stripe-onboarding-button";
import Link from "next/link";

import { FIRM_PORTAL_HOME_PATH } from "@/lib/firms/firm-portal-host";

/** Regenerates Stripe Account Link when the prior link expired (§13.3). */
export default function FirmStripeOnboardingRefreshPage() {
  return (
    <section className="mx-auto max-w-lg space-y-4">
      <h2 className="text-lg font-medium">Stripe Connect setup</h2>
      <p className="text-sm text-muted-foreground">
        Complete Stripe onboarding to accept paid leads in a later release. If
        your link expired, start a fresh session below.
      </p>
      <FirmStripeOnboardingButton />
      <Link href={FIRM_PORTAL_HOME_PATH} className="text-sm underline">
        Back to leads
      </Link>
    </section>
  );
}
