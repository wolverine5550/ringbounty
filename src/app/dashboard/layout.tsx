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
      <div className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6 lg:px-8">
        <DisclaimerBanner variant="block" />
      </div>
    </>
  );
}
