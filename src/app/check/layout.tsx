import { ConsumerFunnelHeader } from "@/components/layout/consumer-funnel-header";

/** Check funnel layout — header chrome only; disclaimer lives in global site footer. */
export default function CheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ConsumerFunnelHeader />
      {children}
    </>
  );
}
