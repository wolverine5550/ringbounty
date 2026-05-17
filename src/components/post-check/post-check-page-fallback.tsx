/** Route-level fallback while post-check auth gate resolves (Next.js 16 Cache Components). */
export function PostCheckPageFallback() {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col gap-4 p-8">
      <p className="text-muted-foreground text-sm">Loading…</p>
    </div>
  );
}
