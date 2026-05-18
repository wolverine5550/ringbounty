import { PostCheckPageFallback } from "@/components/post-check/post-check-page-fallback";

/** Route-level fallback while dashboard auth + claims load (Next.js 16 Cache Components). */
export default function DashboardLoading() {
  return <PostCheckPageFallback />;
}
