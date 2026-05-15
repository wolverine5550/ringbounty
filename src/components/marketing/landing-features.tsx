import { LandingSection } from "@/components/marketing/landing-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LANDING_FEATURES } from "@/lib/marketing/landing-content";

/** Three-column key features grid (wireframe). */
export function LandingFeatures() {
  return (
    <LandingSection
      id="features"
      variant="muted"
      title="Key features"
      description="Everything you need to explore TCPA issues and prepare a demand letter — in one informational workflow."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LANDING_FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.id} className="border-border/80 shadow-sm">
              <CardHeader>
                <div className="bg-muted mb-2 flex h-12 w-12 items-center justify-center rounded-lg">
                  <Icon className="text-foreground h-6 w-6" aria-hidden />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </LandingSection>
  );
}
