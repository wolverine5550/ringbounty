import { LandingSection } from "@/components/marketing/landing-section";
import {
  LANDING_FLOW_STEPS,
  LANDING_HOW_IT_WORKS_SECTION_ID,
} from "@/lib/marketing/landing-content";

/** Homepage “How it works” flow (header anchor target). */
export function LandingHowItWorks() {
  return (
    <LandingSection
      id={LANDING_HOW_IT_WORKS_SECTION_ID}
      title="How it works"
      description="An informational path from screening a number to sending your own demand letter — you stay in control at every step."
    >
      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {LANDING_FLOW_STEPS.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-2">
            <span
              className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
              aria-hidden
            >
              {index + 1}
            </span>
            <h3 className="text-base font-medium">{step.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </LandingSection>
  );
}
