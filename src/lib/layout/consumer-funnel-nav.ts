import { POST_LOGIN_DASHBOARD_PATH } from "@/lib/claims/post-login-redirect";

/** Primary nav for authenticated consumer funnel pages (screening lives on `/dashboard`). */
export const CONSUMER_FUNNEL_NAV_LINKS = [
  { href: POST_LOGIN_DASHBOARD_PATH, label: "Dashboard" },
] as const;

/**
 * Nav links for the logged-in app header — hides Dashboard on `/dashboard`.
 */
export function getConsumerFunnelNavLinksForPath(pathname: string) {
  const onDashboardRoute =
    pathname === POST_LOGIN_DASHBOARD_PATH ||
    pathname.startsWith(`${POST_LOGIN_DASHBOARD_PATH}/`);

  return CONSUMER_FUNNEL_NAV_LINKS.filter((link) => {
    if (onDashboardRoute && link.href === POST_LOGIN_DASHBOARD_PATH) {
      return false;
    }
    return true;
  });
}
