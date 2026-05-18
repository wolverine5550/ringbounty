import { RESULTS_PATH } from "@/lib/claims/gated-routes";

/** Primary nav targets for authenticated consumer funnel pages (`/check`, qualify, results). */
export const CONSUMER_FUNNEL_NAV_LINKS = [
  { href: "/check", label: "Check numbers" },
  { href: RESULTS_PATH, label: "Your results" },
] as const;

const CHECK_PATH = "/check";

/**
 * Nav links for the logged-in app header — omits "Check numbers" on `/check` routes.
 */
export function getConsumerFunnelNavLinksForPath(pathname: string) {
  const onCheckRoute =
    pathname === CHECK_PATH || pathname.startsWith(`${CHECK_PATH}/`);

  return CONSUMER_FUNNEL_NAV_LINKS.filter(
    (link) => !(onCheckRoute && link.href === CHECK_PATH),
  );
}
