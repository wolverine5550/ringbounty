import { DisclaimerBanner } from "@/components/marketing/disclaimer-banner";

/** Post-check funnel layout — disclaimer on results, qualify, summary (§3.6.2). */
export default function PostCheckLayout({
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
