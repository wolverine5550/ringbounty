import { ConsumerFunnelHeader } from "@/components/layout/consumer-funnel-header";
import { DisclaimerBanner } from "@/components/marketing/disclaimer-banner";

/** Authenticated consumer home — lists prior checks and links to results / qualify. */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ConsumerFunnelHeader />
      {children}
      <div className="mx-auto max-w-lg px-8 pb-8">
        <DisclaimerBanner variant="block" />
      </div>
    </>
  );
}
