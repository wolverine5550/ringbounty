import { POST_LOGIN_DASHBOARD_PATH } from "@/lib/claims/post-login-redirect";

/** Primary nav targets for authenticated consumer funnel pages. */
export const CONSUMER_FUNNEL_NAV_LINKS = [
  { href: POST_LOGIN_DASHBOARD_PATH, label: "Dashboard" },
  { href: "/check", label: "Check numbers" },
] as const;

const CHECK_PATH = "/check";

/**
 * Nav links for the logged-in app header — hides the link for the current section.
 */
export function getConsumerFunnelNavLinksForPath(pathname: string) {
  const onCheckRoute =
    pathname === CHECK_PATH || pathname.startsWith(`${CHECK_PATH}/`);
  const onDashboardRoute =
    pathname === POST_LOGIN_DASHBOARD_PATH ||
    pathname.startsWith(`${POST_LOGIN_DASHBOARD_PATH}/`);

  return CONSUMER_FUNNEL_NAV_LINKS.filter((link) => {
    if (onCheckRoute && link.href === CHECK_PATH) {
      return false;
    }
    if (onDashboardRoute && link.href === POST_LOGIN_DASHBOARD_PATH) {
      return false;
    }
    return true;
  });
}
