import { DisclaimerBanner } from "@/components/marketing/disclaimer-banner";

/** Check funnel layout — PRD disclaimer on check + account-required (§3.6.2). */
export default function CheckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <div className="mx-auto max-w-lg px-8 pb-8">
        <DisclaimerBanner variant="block" />
      </div>
    </>
  );
}
