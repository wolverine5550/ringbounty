/**
 * Route-level fallback for the `/protected` segment (Next.js 16 + Cache Components).
 * See: https://nextjs.org/docs/messages/blocking-route
 */
export default function ProtectedLoading() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-10">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}
