import { redirect } from "next/navigation";

import { FIRM_LANDING_PATH } from "@/lib/firms/firm-portal-host";

/**
 * Firm portal sign-in is closed for public onboarding — send visitors to the firm landing page.
 */
export default function FirmLoginPage() {
  redirect(FIRM_LANDING_PATH);
}
