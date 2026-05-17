import { PostCheckPageFallback } from "@/components/post-check/post-check-page-fallback";

/**
 * Post-check segment loading UI (Next.js 16 Cache Components).
 * @see https://nextjs.org/docs/messages/blocking-route
 */
export default function PostCheckLoading() {
  return <PostCheckPageFallback />;
}
