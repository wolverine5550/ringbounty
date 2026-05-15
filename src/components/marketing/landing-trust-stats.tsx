import { LandingSection } from "@/components/marketing/landing-section";
import { TRUST_STRIP_LINE } from "@/lib/marketing/constants";
import { LANDING_STATS } from "@/lib/marketing/landing-content";

/**
 * Trust band: informational stats only (wireframe right column — no customer logos).
 */
export function LandingTrustStats() {
  return (
    <LandingSection variant="muted">
      <p className="text-muted-foreground mb-8 text-center text-xs sm:text-sm">
        {TRUST_STRIP_LINE}
      </p>
      <div className="grid gap-8 md:grid-cols-3">
        {LANDING_STATS.map((stat) => (
          <div
            key={stat.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              {stat.label}
            </p>
            <p className="text-2xl font-semibold tracking-tight">{stat.value}</p>
            <div
              className="bg-muted h-2 w-full overflow-hidden rounded-full"
              role="presentation"
            >
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${stat.percent}%` }}
              />
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {stat.detail}
            </p>
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
