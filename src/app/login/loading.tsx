/**
 * Route-level fallback while request-time data for `/login` resolves (Next.js 16 + Cache Components).
 * See: https://nextjs.org/docs/messages/blocking-route
 */
export default function LoginLoading() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
