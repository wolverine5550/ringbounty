import { ConsumerFunnelHeader } from "@/components/layout/consumer-funnel-header";
import { DisclaimerBanner } from "@/components/marketing/disclaimer-banner";

/** Check funnel layout — PRD disclaimer on check + account-required (§3.6.2). */
export default function CheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ConsumerFunnelHeader />
      {children}
      <div className="mx-auto max-w-lg px-4 pb-6 sm:px-6 sm:pb-8">
        <DisclaimerBanner variant="block" />
      </div>
    </>
  );
}
