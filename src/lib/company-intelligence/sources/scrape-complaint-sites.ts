/**
 * CI-5.1 — Direct complaint-site scrape (800notes, WhoCalledMe, CallerComplaints).
 *
 * Fetches one page per site per phone, extracts user comment text, and passes blocks to
 * OpenRouter synthesis (CI-4.2). Default off — see legal spike CI-5.1.1.
 *
 * Prefer SerpAPI (CI-4.1) first; scrape supplements Round 4 context when enabled.
 */

import { normalizeNanp10Key } from "@/lib/check/us-phone";
import { parseBooleanEnv } from "@/lib/spam/provider-flags";

import type { CompanyIntelligenceEnv } from "../company-intelligence-flags";
import { redactPhonePiiForLog } from "./serpapi-complaint-search";
import type { IntelSourceHit } from "../types";

/** Feature flag — default false until counsel + staging bake-off (CI-5.1.3). */
export const COMPANY_INTEL_SCRAPE_ENABLED_ENV_KEY =
  "COMPANY_INTEL_SCRAPE_ENABLED" as const;

export const DEFAULT_COMPLAINT_SITE_SCRAPE_TIMEOUT_MS = 8_000;

/** Max comments merged into OpenRouter payload per site. */
export const MAX_COMMENTS_PER_SITE = 15;

/** Truncate individual comment bodies before synthesis. */
export const MAX_COMMENT_TEXT_CHARS = 2_000;

export const COMPLAINT_SITE_USER_AGENT =
  "RingBounty-CompanyIntel/1.0 (+https://ringbounty.com; complaint-lookup-only)" as const;

export type ComplaintSiteId = "800notes" | "whocalledme" | "callercomplaints";

export type ComplaintSiteComment = {
  site: ComplaintSiteId;
  url: string;
  text: string;
};

export type ComplaintSiteScrapeSkippedReason =
  | "disabled"
  | "invalid_phone";

export type ComplaintSiteFetchSkippedReason =
  | "http_error"
  | "parse_error"
  | "empty_page";

export type ComplaintSitePageResult = {
  site: ComplaintSiteId;
  url: string;
  comments: ComplaintSiteComment[];
  skippedReason: ComplaintSiteFetchSkippedReason | null;
  httpStatus?: number;
};

export type ScrapeComplaintSitesResult = {
  comments: ComplaintSiteComment[];
  skippedReason: ComplaintSiteScrapeSkippedReason | null;
  pages: ComplaintSitePageResult[];
  /** Stored under `raw_results.complaint_site_scrape` — no full HTML. */
  raw: Record<string, unknown>;
};

export type ScrapeComplaintSitesOptions = {
  enabled?: boolean;
  env?: CompanyIntelligenceEnv;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

type SiteConfig = {
  id: ComplaintSiteId;
  buildUrl: (tenDigitNanp: string) => string;
  extractComments: (html: string) => string[];
};

/**
 * Returns whether direct complaint-site scrape is enabled (CI-5.1.3).
 */
export function isComplaintSiteScrapeEnabled(
  env: CompanyIntelligenceEnv = process.env,
): boolean {
  return parseBooleanEnv(env[COMPANY_INTEL_SCRAPE_ENABLED_ENV_KEY]);
}

/**
 * NANP display for complaint-site URLs (1-NXX-NXX-XXXX for toll-free, else NXX-NXX-XXXX).
 */
export function formatPhoneForComplaintSiteUrls(tenDigitNanp: string): string {
  const tollFreeNpas = new Set([
    "800",
    "833",
    "844",
    "855",
    "866",
    "877",
    "888",
  ]);
  const npa = tenDigitNanp.slice(0, 3);
  const rest = `${tenDigitNanp.slice(3, 6)}-${tenDigitNanp.slice(6)}`;
  if (tollFreeNpas.has(npa)) {
    return `1-${npa}-${rest}`;
  }
  return `${npa}-${rest}`;
}

/**
 * Builds canonical complaint-site URLs for a normalized phone (product spec).
 */
export function buildComplaintSiteUrls(
  phoneNumberNormalized: string,
): Record<ComplaintSiteId, string> | null {
  const ten = normalizeNanp10Key(phoneNumberNormalized);
  if (!ten) {
    return null;
  }
  const formatted = formatPhoneForComplaintSiteUrls(ten);
  return {
    "800notes": `https://800notes.com/Phone.aspx/${formatted}`,
    whocalledme: `https://www.whocalledme.com/Phone/${formatted}`,
    callercomplaints: `https://www.callercomplaints.com/${formatted}`,
  };
}

/**
 * Strips HTML tags and collapses whitespace for comment text extraction.
 */
export function stripHtmlToPlainText(htmlFragment: string): string {
  return htmlFragment
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueNonEmptyTexts(texts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of texts) {
    const text =
      raw.length > MAX_COMMENT_TEXT_CHARS
        ? `${raw.slice(0, MAX_COMMENT_TEXT_CHARS)}…`
        : raw;
    if (text.length < 12) {
      continue;
    }
    const key = text.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(text);
    if (out.length >= MAX_COMMENTS_PER_SITE) {
      break;
    }
  }
  return out;
}

/**
 * 800notes — `comment-text` blocks (fixture + common layout).
 */
export function extract800notesComments(html: string): string[] {
  const texts: string[] = [];
  const re =
    /class="[^"]*comment-text[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div|motion\.div)>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const plain = stripHtmlToPlainText(match[1] ?? "");
    if (plain) {
      texts.push(plain);
    }
  }
  return uniqueNonEmptyTexts(texts);
}

/**
 * WhoCalledMe — `comment-body` spans/divs.
 */
export function extractWhocalledmeComments(html: string): string[] {
  const texts: string[] = [];
  const re =
    /class="[^"]*comment-body[^"]*"[^>]*>([\s\S]*?)<\/(?:span|motion\.div|motion.div|div)>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const plain = stripHtmlToPlainText(match[1] ?? "");
    if (plain) {
      texts.push(plain);
    }
  }
  return uniqueNonEmptyTexts(texts);
}

/**
 * CallerComplaints — `complaint-text` entries.
 */
export function extractCallercomplaintsComments(html: string): string[] {
  const texts: string[] = [];
  const re =
    /class="[^"]*complaint-text[^"]*"[^>]*>([\s\S]*?)<\/(?:motion\.motion\.motion\.div|motion\.div|div|article)>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const plain = stripHtmlToPlainText(match[1] ?? "");
    if (plain) {
      texts.push(plain);
    }
  }
  return uniqueNonEmptyTexts(texts);
}

const COMPLAINT_SITES: SiteConfig[] = [
  {
    id: "800notes",
    buildUrl: (ten) =>
      `https://800notes.com/Phone.aspx/${formatPhoneForComplaintSiteUrls(ten)}`,
    extractComments: extract800notesComments,
  },
  {
    id: "whocalledme",
    buildUrl: (ten) =>
      `https://www.whocalledme.com/Phone/${formatPhoneForComplaintSiteUrls(ten)}`,
    extractComments: extractWhocalledmeComments,
  },
  {
    id: "callercomplaints",
    buildUrl: (ten) =>
      `https://www.callercomplaints.com/${formatPhoneForComplaintSiteUrls(ten)}`,
    extractComments: extractCallercomplaintsComments,
  },
];

async function fetchComplaintSiteHtml(
  url: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<{ ok: true; html: string; httpStatus: number } | { ok: false; httpStatus?: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchImpl(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": COMPLAINT_SITE_USER_AGENT,
      },
    });

    if (!res.ok) {
      console.error(
        "[scrape-complaint-sites]",
        redactPhonePiiForLog(`HTTP ${res.status} for ${url}`),
      );
      return { ok: false, httpStatus: res.status };
    }

    const html = await res.text();
    return { ok: true, html, httpStatus: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error(
      "[scrape-complaint-sites]",
      redactPhonePiiForLog(`fetch failed (${url}): ${message}`),
    );
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetches and parses one complaint site page.
 */
export async function scrapeComplaintSitePage(
  site: SiteConfig,
  tenDigitNanp: string,
  options: { fetchImpl: typeof fetch; timeoutMs: number },
): Promise<ComplaintSitePageResult> {
  const url = site.buildUrl(tenDigitNanp);
  const fetched = await fetchComplaintSiteHtml(
    url,
    options.fetchImpl,
    options.timeoutMs,
  );

  if (!fetched.ok) {
    return {
      site: site.id,
      url,
      comments: [],
      skippedReason: "http_error",
      httpStatus: fetched.httpStatus,
    };
  }

  const plainTexts = site.extractComments(fetched.html);
  if (plainTexts.length === 0) {
    return {
      site: site.id,
      url,
      comments: [],
      skippedReason: "empty_page",
      httpStatus: fetched.httpStatus,
    };
  }

  return {
    site: site.id,
    url,
    comments: plainTexts.map((text) => ({ site: site.id, url, text })),
    skippedReason: null,
    httpStatus: fetched.httpStatus,
  };
}

function skippedAll(
  reason: ComplaintSiteScrapeSkippedReason,
): ScrapeComplaintSitesResult {
  return {
    comments: [],
    skippedReason: reason,
    pages: [],
    raw: { skipped: true, reason },
  };
}

/**
 * CI-5.1.2 — Fetches 800notes + WhoCalledMe + CallerComplaints comment text for one phone.
 */
export async function scrapeComplaintSites(
  phoneNumberNormalized: string,
  options: ScrapeComplaintSitesOptions = {},
): Promise<ScrapeComplaintSitesResult> {
  const env = options.env ?? process.env;
  const enabled = options.enabled ?? isComplaintSiteScrapeEnabled(env);

  if (!enabled) {
    return skippedAll("disabled");
  }

  const ten = normalizeNanp10Key(phoneNumberNormalized);
  if (!ten) {
    return skippedAll("invalid_phone");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs =
    options.timeoutMs ?? DEFAULT_COMPLAINT_SITE_SCRAPE_TIMEOUT_MS;

  const pages = await Promise.all(
    COMPLAINT_SITES.map((site) =>
      scrapeComplaintSitePage(site, ten, { fetchImpl, timeoutMs }),
    ),
  );

  const comments = pages.flatMap((p) => p.comments);

  return {
    comments,
    skippedReason: null,
    pages,
    raw: {
      comment_count: comments.length,
      pages: pages.map((p) => ({
        site: p.site,
        url: p.url,
        comment_count: p.comments.length,
        skipped_reason: p.skippedReason,
        http_status: p.httpStatus ?? null,
      })),
    },
  };
}

/**
 * Maps scrape output to orchestrator hits + `raw_results` slice (CI-5.1.2).
 */
export function scrapeResultToComplaintSitePayload(
  scrape: ScrapeComplaintSitesResult,
): {
  hits: IntelSourceHit[];
  rawResultsSlice: Record<string, unknown>;
  auditSkippedReason: string | null;
} {
  if (scrape.skippedReason) {
    return {
      hits: [],
      rawResultsSlice: { complaint_site_scrape: scrape.raw },
      auditSkippedReason: `scrape_${scrape.skippedReason}`,
    };
  }

  const hits: IntelSourceHit[] =
    scrape.comments.length > 0
      ? [{ tier: "complaint_site_scrape", companyName: null }]
      : [];

  return {
    hits,
    rawResultsSlice: { complaint_site_scrape: scrape.raw },
    auditSkippedReason:
      scrape.comments.length === 0 ? "scrape_no_comments" : null,
  };
}
