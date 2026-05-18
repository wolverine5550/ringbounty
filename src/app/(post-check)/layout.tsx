import { ConsumerFunnelHeader } from "@/components/layout/consumer-funnel-header";
import { DisclaimerBanner } from "@/components/marketing/disclaimer-banner";

/** Post-check funnel layout — disclaimer on results, qualify, summary (§3.6.2). */
export default function PostCheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ConsumerFunnelHeader />
      {children}
      <div className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
        <DisclaimerBanner variant="block" />
      </div>
    </>
  );
}
