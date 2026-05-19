import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

import {
  buildComplaintSiteUrls,
  extract800notesComments,
  extractCallercomplaintsComments,
  extractWhocalledmeComments,
  formatPhoneForComplaintSiteUrls,
  scrapeComplaintSitePage,
  scrapeComplaintSites,
  scrapeResultToComplaintSitePayload,
  stripHtmlToPlainText,
} from "./scrape-complaint-sites";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "fixtures",
);

function loadFixture(name: string): string {
  return readFileSync(join(fixtureDir, name), "utf8");
}

describe("formatPhoneForComplaintSiteUrls (CI-5.1)", () => {
  it("formats toll-free with leading 1", () => {
    expect(formatPhoneForComplaintSiteUrls("8005551234")).toBe("1-800-555-1234");
  });

  it("formats geographic NANP without leading 1", () => {
    expect(formatPhoneForComplaintSiteUrls("2125551234")).toBe("212-555-1234");
  });
});

describe("buildComplaintSiteUrls (CI-5.1)", () => {
  it("builds three site URLs for E.164 input", () => {
    expect(buildComplaintSiteUrls("+18005551234")).toEqual({
      "800notes": "https://800notes.com/Phone.aspx/1-800-555-1234",
      whocalledme: "https://www.whocalledme.com/Phone/1-800-555-1234",
      callercomplaints: "https://www.callercomplaints.com/1-800-555-1234",
    });
  });

  it("returns null for invalid phone", () => {
    expect(buildComplaintSiteUrls("123")).toBeNull();
  });
});

describe("HTML comment extractors (CI-5.1.4 fixtures)", () => {
  it("extracts 800notes comment-text blocks", () => {
    const html = loadFixture("800notes-sample.html");
    const texts = extract800notesComments(html);
    expect(texts).toHaveLength(2);
    expect(texts[0]).toContain("CarShield");
  });

  it("extracts whocalledme comment-body blocks", () => {
    const html = loadFixture("whocalledme-sample.html");
    const texts = extractWhocalledmeComments(html);
    expect(texts).toHaveLength(1);
    expect(texts[0]).toContain("ABC Recovery");
  });

  it("extracts callercomplaints complaint-text blocks", () => {
    const html = loadFixture("callercomplaints-sample.html");
    const texts = extractCallercomplaintsComments(html);
    expect(texts).toHaveLength(1);
    expect(texts[0]).toContain("SunPower");
  });

  it("stripHtmlToPlainText decodes entities", () => {
    expect(stripHtmlToPlainText("<b>Hi</b> &amp; bye")).toBe("Hi & bye");
  });
});

describe("scrapeComplaintSites (CI-5.1.2)", () => {
  it("skips when disabled", async () => {
    const result = await scrapeComplaintSites("+18005551234", {
      enabled: false,
    });
    expect(result.skippedReason).toBe("disabled");
    expect(result.comments).toHaveLength(0);
  });

  it("fetches all three fixtures via mocked fetch", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const href = String(input);
      if (href.includes("800notes")) {
        return new Response(loadFixture("800notes-sample.html"), { status: 200 });
      }
      if (href.includes("whocalledme")) {
        return new Response(loadFixture("whocalledme-sample.html"), {
          status: 200,
        });
      }
      if (href.includes("callercomplaints")) {
        return new Response(loadFixture("callercomplaints-sample.html"), {
          status: 200,
        });
      }
      return new Response("not found", { status: 404 });
    });

    const result = await scrapeComplaintSites("+18005551234", {
      enabled: true,
      fetchImpl,
    });

    expect(result.skippedReason).toBeNull();
    expect(result.comments.length).toBeGreaterThanOrEqual(3);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(result.raw.comment_count).toBe(result.comments.length);
  });

  it("maps to orchestrator payload with complaint_site_scrape hit", () => {
    const payload = scrapeResultToComplaintSitePayload({
      comments: [
        {
          site: "800notes",
          url: "https://800notes.com/Phone.aspx/1-800-555-1234",
          text: "CarShield warranty robocall",
        },
      ],
      skippedReason: null,
      pages: [],
      raw: { comment_count: 1 },
    });
    expect(payload.hits).toEqual([
      { tier: "complaint_site_scrape", companyName: null },
    ]);
    expect(payload.auditSkippedReason).toBeNull();
  });
});

describe("scrapeComplaintSitePage HTTP errors", () => {
  it("returns http_error when fetch fails", async () => {
    const fetchImpl = vi.fn(async () => new Response("", { status: 503 }));
    const result = await scrapeComplaintSitePage(
      {
        id: "800notes",
        buildUrl: () => "https://800notes.com/Phone.aspx/1-800-555-1234",
        extractComments: extract800notesComments,
      },
      "8005551234",
      { fetchImpl, timeoutMs: 5_000 },
    );
    expect(result.skippedReason).toBe("http_error");
    expect(result.comments).toHaveLength(0);
  });
});
