/** Dashboard loading shell — matches wide page layout. */
export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="bg-muted h-9 w-48 animate-pulse rounded-md" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <div className="bg-muted h-64 animate-pulse rounded-xl" />
        <div className="bg-muted h-48 animate-pulse rounded-xl" />
      </div>
    </div>
  );
}
