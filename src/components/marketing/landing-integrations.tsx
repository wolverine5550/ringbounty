import { Badge } from "@/components/ui/badge";
import { LandingSection } from "@/components/marketing/landing-section";
import {
  LANDING_INTEGRATIONS,
  LANDING_TRUST_BADGES,
} from "@/lib/marketing/landing-content";

/** Integrations + trust badges (wireframe — not customer testimonials). */
export function LandingIntegrations() {
  return (
    <LandingSection
      id="integrations"
      title="Built on trusted infrastructure"
      description="Payments, auth, and data are handled by established providers. Badges below describe our product model, not client endorsements."
    >
      <div className="flex flex-col gap-10">
        <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {LANDING_INTEGRATIONS.map((item) => (
            <li key={item.id}>
              <span className="bg-muted text-foreground flex h-14 w-14 items-center justify-center rounded-full border border-border text-xs font-semibold sm:h-16 sm:w-16 sm:text-sm">
                {item.name.slice(0, 2).toUpperCase()}
              </span>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap items-center justify-center gap-3">
          {LANDING_TRUST_BADGES.map((badge) => (
            <li key={badge}>
              <Badge variant="secondary" className="px-3 py-1 text-xs font-normal">
                {badge}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </LandingSection>
  );
}
