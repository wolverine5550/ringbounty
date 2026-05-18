"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CHECK_FREE_LOOKUP_MAX_PHONES,
  CHECK_NUMBER_ENTRY_HEADING,
  RB_CHECK_SUBMITTED_EVENT,
} from "@/lib/check/constants";
import {
  extractUsPhoneDigits,
  formatUsPhoneMask,
  normalizeUsPhoneToE164,
} from "@/lib/check/us-phone";
import type { NumberCheckSummary } from "@/lib/check/parallel-check-pipeline-stub";
import { EXEMPT_TCPA_USER_MESSAGE } from "@/lib/constants/exempt-categories";
import { FDCPA_DEBT_COLLECTION_USER_MESSAGE } from "@/lib/constants/fdcpa-debt-collection";
import { FEDERAL_DNC_UNAVAILABLE_USER_MESSAGE } from "@/lib/constants/federal-dnc-unavailable";
import {
  COMPANY_CNAM_HINT_PREFIX,
  COMPANY_UNIDENTIFIED_CHECK_MESSAGE,
} from "@/lib/constants/company-identification";
import {
  CHECK_CONTINUE_TO_QUALIFY_HELP,
  CHECK_CONTINUE_TO_QUALIFY_LABEL,
  NO_SPAM_HIT_HEADLINE,
  NO_SPAM_HIT_USER_MESSAGE,
} from "@/lib/constants/no-spam-hit";
import {
  allNumberChecksExempt,
  buildCheckFunnelContinueTarget,
} from "@/lib/check/check-funnel-continue";
import {
  getStateSosBusinessSearchUrl,
  OPENCORPORATES_RATE_LIMIT_USER_MESSAGE,
  REGISTERED_AGENT_MANUAL_LOOKUP_MESSAGE,
} from "@/lib/constants/registered-agent-lookup";
import { RATE_LIMIT_USER_MESSAGE } from "@/lib/rate-limit/constants";

const PROVIDER_CHECK_LABEL: Record<string, string> = {
  nomorobo: "Nomorobo lookup",
  twilio: "Twilio lookup",
  nomorobo_stub: "Nomorobo lookup (stub)",
  twilio_stub: "Twilio lookup (stub)",
};

/** Milliseconds to wait before a §4.6 retry after consecutive failures (capped). */
function checkSubmitRetryBackoffMs(failureCount: number): number {
  if (failureCount <= 0) {
    return 0;
  }
  return Math.min(8000, 1000 * 2 ** (failureCount - 1));
}

type PhoneRow = {
  id: string;
  /** Up to 10 NANP digits (national number, no country code stored). */
  digits: string;
};

/** Duplicate rows keyed by validated E.164 (task_manager §4.3.3 + §4.4 NANP validation). */
function digitLengthIssue(digits: string): "incomplete" | null {
  const len = extractUsPhoneDigits(digits).length;
  if (len === 0 || len >= 10) {
    return null;
  }
  return "incomplete";
}

/** Row-level validation for §4.4 (excluding duplicates). */
function rowValidityHint(digits: string): string | null {
  if (digitLengthIssue(digits) === "incomplete") {
    return "Enter all 10 digits.";
  }
  if (digits.length === 10 && normalizeUsPhoneToE164(digits) === null) {
    return "That number does not match a valid U.S. area / exchange pattern.";
  }
  return null;
}

function computeDuplicateRowIds(rows: PhoneRow[]): Set<string> {
  const byKey = new Map<string, string[]>();
  for (const row of rows) {
    const key = normalizeUsPhoneToE164(row.digits);
    if (key === null) {
      continue;
    }
    const bucket = byKey.get(key) ?? [];
    bucket.push(row.id);
    byKey.set(key, bucket);
  }
  const dup = new Set<string>();
  for (const ids of byKey.values()) {
    if (ids.length > 1) {
      for (const id of ids) {
        dup.add(id);
      }
    }
  }
  return dup;
}

/**
 * `/check` — masked US NANP rows, validation + submit (§4.3–4.6).
 * Evidence preservation runs on `/attorney-connect` before referral (PRD §10).
 */
export function CheckFunnelClient() {
  /** Stable across SSR + hydration (do not use `crypto.randomUUID()` for row keys). */
  const phoneRowIdPrefix = useId();
  const nextPhoneRowIndexRef = useRef(1);

  const [phoneRows, setPhoneRows] = useState<PhoneRow[]>(() => [
    { id: `${phoneRowIdPrefix}-0`, digits: "" },
  ]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [checkSubmitting, setCheckSubmitting] = useState(false);
  const [retryWaiting, setRetryWaiting] = useState(false);
  const [submitFailureCount, setSubmitFailureCount] = useState(0);
  const [numberChecks, setNumberChecks] = useState<NumberCheckSummary[] | null>(
    null,
  );
  const [federalDncMessage, setFederalDncMessage] = useState<string | null>(
    null,
  );
  const [lastClaimId, setLastClaimId] = useState<string | null>(null);
  const [lastClaimSubjectIds, setLastClaimSubjectIds] = useState<string[]>([]);
  const [requiresAccountWall, setRequiresAccountWall] = useState(false);
  const stepOneRef = useRef<HTMLElement | null>(null);

  const refreshGateStatus = useCallback(async () => {
    const res = await fetch("/api/claims/anonymous/status", {
      credentials: "include",
    });
    if (!res.ok) {
      return;
    }
    const body = (await res.json()) as {
      requires_account_wall?: boolean;
    };
    setRequiresAccountWall(body.requires_account_wall === true);
  }, []);

  const validPhoneRowsForSubmit = useMemo(
    () => phoneRows.filter((r) => normalizeUsPhoneToE164(r.digits) !== null),
    [phoneRows],
  );

  const duplicateRowIds = useMemo(
    () => computeDuplicateRowIds(phoneRows),
    [phoneRows],
  );

  const changeRowDigits = useCallback((rowId: string, raw: string) => {
    setSubmitError(null);
    setNumberChecks(null);
    const digits = extractUsPhoneDigits(raw).slice(0, 10);
    setPhoneRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, digits } : row)),
    );
  }, []);

  const addPhoneRow = useCallback(() => {
    setPhoneRows((prev) => {
      if (prev.length >= CHECK_FREE_LOOKUP_MAX_PHONES) {
        return prev;
      }
      const index = nextPhoneRowIndexRef.current;
      nextPhoneRowIndexRef.current += 1;
      return [
        ...prev,
        { id: `${phoneRowIdPrefix}-${String(index)}`, digits: "" },
      ];
    });
  }, [phoneRowIdPrefix]);

  const removePhoneRow = useCallback(
    (rowId: string) => {
      setPhoneRows((prev) => {
        if (prev.length <= 1) {
          const only = prev[0];
          if (!only) {
            return [{ id: `${phoneRowIdPrefix}-0`, digits: "" }];
          }
          return [{ id: only.id, digits: "" }];
        }
        return prev.filter((r) => r.id !== rowId);
      });
    },
    [phoneRowIdPrefix],
  );

  const runCheckSubmit = useCallback(
    async (options?: { isBackoffRetry?: boolean }) => {
    if (requiresAccountWall) {
      return;
    }

    setSubmitError(null);
    setRateLimitMessage(null);

    const validRows = phoneRows.filter(
      (r) => normalizeUsPhoneToE164(r.digits) !== null,
    );

    if (validRows.length === 0) {
      setSubmitError(
        "Enter at least one complete, valid U.S. phone number to run a check.",
      );
      return;
    }

    if (duplicateRowIds.size > 0) {
      setSubmitError(
        "Remove or change duplicate numbers before running the check.",
      );
      return;
    }

    const e164List = validRows.map((r) => normalizeUsPhoneToE164(r.digits)!);

    const unique = new Set(e164List);
    if (unique.size !== e164List.length) {
      setSubmitError("Duplicate numbers detected.");
      return;
    }

    if (options?.isBackoffRetry && submitFailureCount > 0) {
      const waitMs = checkSubmitRetryBackoffMs(submitFailureCount);
      if (waitMs > 0) {
        setRetryWaiting(true);
        await new Promise((r) => setTimeout(r, waitMs));
        setRetryWaiting(false);
      }
    }

    setCheckSubmitting(true);
    setNumberChecks(null);
    setFederalDncMessage(null);
    setLastClaimId(null);
    setLastClaimSubjectIds([]);
    try {
      const res = await fetch("/api/check/submit", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_numbers: e164List,
          phone_displays: validRows.map((r) => formatUsPhoneMask(r.digits)),
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        claim_id?: string;
        claim_subject_ids?: string[];
        number_checks?: NumberCheckSummary[];
        federal_dnc?: { user_message?: string };
      };

      if (res.status === 429) {
        setSubmitFailureCount((n) => n + 1);
        setRateLimitMessage(body.error ?? RATE_LIMIT_USER_MESSAGE);
        return;
      }

      if (!res.ok) {
        setSubmitFailureCount((n) => n + 1);
        setSubmitError(
          body.error ?? `Check request failed (${String(res.status)}).`,
        );
        return;
      }

      setSubmitFailureCount(0);

      if (typeof body.claim_id === "string" && body.claim_id.length > 0) {
        setLastClaimId(body.claim_id);
      }
      if (Array.isArray(body.claim_subject_ids)) {
        setLastClaimSubjectIds(body.claim_subject_ids);
      }

      const checks = Array.isArray(body.number_checks)
        ? body.number_checks
        : null;
      setNumberChecks(checks ?? []);

      await refreshGateStatus();

      const dncMsg = body.federal_dnc?.user_message?.trim();
      setFederalDncMessage(
        checks && checks.length > 0
          ? dncMsg && dncMsg.length > 0
            ? dncMsg
            : FEDERAL_DNC_UNAVAILABLE_USER_MESSAGE
          : null,
      );

      if (checks?.some((row) => row.had_provider_failure)) {
        setSubmitError(
          "Some data sources did not respond. Details are shown below; saved numbers stay on your claim.",
        );
      }

      window.dispatchEvent(new Event(RB_CHECK_SUBMITTED_EVENT));
    } catch {
      setSubmitFailureCount((n) => n + 1);
      setSubmitError("Could not run check. Please try again.");
    } finally {
      setCheckSubmitting(false);
    }
    },
    [
      duplicateRowIds.size,
      phoneRows,
      refreshGateStatus,
      requiresAccountWall,
      submitFailureCount,
    ],
  );

  const continueTarget = useMemo(() => {
    if (!lastClaimId || !numberChecks?.length) {
      return null;
    }
    return buildCheckFunnelContinueTarget({
      claimId: lastClaimId,
      claimSubjectIds: lastClaimSubjectIds,
      numberChecks,
      requiresAccountWall,
    });
  }, [lastClaimId, lastClaimSubjectIds, numberChecks, requiresAccountWall]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/claims/anonymous/status", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok || cancelled) {
          return null;
        }
        return (await res.json()) as { requires_account_wall?: boolean };
      })
      .then((body) => {
        if (!cancelled && body) {
          setRequiresAccountWall(body.requires_account_wall === true);
        }
      })
      .catch(() => {
        /* Gate status is optional on first paint */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const node = stepOneRef.current;
    if (!node) {
      return;
    }
    node.focus({ preventScroll: true });
  }, []);

  return (
    <>
      <section
        ref={stepOneRef}
        id="check-number-entry"
        tabIndex={-1}
        aria-labelledby="check-number-entry-heading"
        className="flex flex-col gap-4 rounded-lg border border-border bg-muted/10 p-4 outline-none"
      >
          <div className="flex flex-col gap-2">
            <h2
              id="check-number-entry-heading"
              className="text-lg font-semibold tracking-tight"
            >
              {CHECK_NUMBER_ENTRY_HEADING}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              U.S. numbers only. Formatting is added as you type; the server stores
              a normalized +1-form number and optionally your masked display string.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {phoneRows.map((row, index) => {
              const dup = duplicateRowIds.has(row.id);
              const validityHint = dup ? null : rowValidityHint(row.digits);
              const alertText = dup
                ? "Duplicate number — change or remove this row."
                : validityHint;
              const inputId = `check-phone-${row.id}`;
              return (
                <li key={row.id} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-2">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={inputId} className="sr-only">
                      Phone number {index + 1}
                    </Label>
                    <Input
                      id={inputId}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="(555) 555-5555"
                      aria-invalid={alertText !== null}
                      disabled={requiresAccountWall || checkSubmitting}
                      value={formatUsPhoneMask(row.digits)}
                      onChange={(e) => changeRowDigits(row.id, e.target.value)}
                      className="font-mono"
                    />
                    {alertText !== null ? (
                      <p
                        className="text-destructive mt-1 text-xs"
                        role="alert"
                      >
                        {alertText}
                      </p>
                    ) : null}
                  </div>
                  {CHECK_FREE_LOOKUP_MAX_PHONES > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 self-stretch sm:mt-0"
                      disabled={phoneRows.length <= 1}
                      onClick={() => removePhoneRow(row.id)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {CHECK_FREE_LOOKUP_MAX_PHONES > 1 ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={phoneRows.length >= CHECK_FREE_LOOKUP_MAX_PHONES}
                onClick={addPhoneRow}
              >
                Add number
              </Button>
              <p className="text-muted-foreground text-xs">
                Up to {String(CHECK_FREE_LOOKUP_MAX_PHONES)} numbers per check.
              </p>
            </div>
          ) : null}

          {rateLimitMessage ? (
            <p className="text-warning text-sm" role="alert">
              {rateLimitMessage}
            </p>
          ) : null}

          {submitError ? (
            <p
              className={
                numberChecks?.some((r) => r.had_provider_failure)
                  ? "text-warning text-sm"
                  : "text-destructive text-sm"
              }
              role="alert"
            >
              {submitError}
            </p>
          ) : null}

          {checkSubmitting ? (
            <div
              className="flex flex-col gap-2"
              aria-busy="true"
              aria-label="Check status by number"
            >
              <p className="text-muted-foreground text-xs">
                Running checks (parallel per number)…
              </p>
              <ul className="flex flex-col gap-2">
                {validPhoneRowsForSubmit.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center"
                  >
                    <div className="bg-muted h-4 w-32 shrink-0 animate-pulse rounded" />
                    <div className="flex flex-1 flex-wrap gap-2">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div
                          key={`${row.id}-sk-${String(i)}`}
                          className="bg-muted h-7 min-w-[7rem] flex-1 animate-pulse rounded-md"
                        />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {federalDncMessage ? (
            <p
              className="text-muted-foreground text-xs leading-relaxed"
              role="status"
            >
              {federalDncMessage}
            </p>
          ) : null}

          {numberChecks !== null && numberChecks.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Check results</p>
              <ul className="flex flex-col gap-3">
                {numberChecks.map((row) => (
                  <li
                    key={row.phone_number_normalized}
                    className="rounded-md border border-border bg-card/30 p-3 text-sm"
                  >
                    <p className="font-mono text-xs">
                      {row.phone_number_normalized}
                    </p>
                    {row.is_debt_collection ? (
                      <p
                        className="text-muted-foreground mt-2 text-xs leading-relaxed"
                        role="status"
                      >
                        {FDCPA_DEBT_COLLECTION_USER_MESSAGE}
                      </p>
                    ) : row.is_exempt ? (
                      <p
                        className="text-muted-foreground mt-2 text-xs leading-relaxed"
                        role="status"
                      >
                        {EXEMPT_TCPA_USER_MESSAGE}
                      </p>
                    ) : row.is_known_spammer === false ? (
                      <div className="mt-2 flex flex-col gap-1" role="status">
                        <p className="text-foreground text-xs font-medium">
                          {NO_SPAM_HIT_HEADLINE}
                        </p>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          {NO_SPAM_HIT_USER_MESSAGE}
                        </p>
                      </div>
                    ) : row.company_identified === false ? (
                      <p
                        className="text-muted-foreground mt-2 text-xs leading-relaxed"
                        role="status"
                      >
                        {COMPANY_UNIDENTIFIED_CHECK_MESSAGE}
                      </p>
                    ) : null}
                    {row.company_identified === true && row.company_name ? (
                      <p className="text-muted-foreground mt-2 text-xs">
                        Company identified:{" "}
                        <span className="text-foreground font-medium">
                          {row.company_name}
                        </span>
                      </p>
                    ) : null}
                    {row.registered_agent_rate_limited ? (
                      <p
                        className="text-muted-foreground mt-2 text-xs leading-relaxed"
                        role="status"
                      >
                        {OPENCORPORATES_RATE_LIMIT_USER_MESSAGE}
                      </p>
                    ) : row.registered_agent_found &&
                      row.registered_agent_name ? (
                      <p className="text-muted-foreground mt-2 text-xs">
                        Registered agent:{" "}
                        <span className="text-foreground font-medium">
                          {row.registered_agent_name}
                        </span>
                      </p>
                    ) : row.registered_agent_manual_lookup_required ? (
                      <p
                        className="text-muted-foreground mt-2 text-xs leading-relaxed"
                        role="status"
                      >
                        {REGISTERED_AGENT_MANUAL_LOOKUP_MESSAGE}{" "}
                        <a
                          href={getStateSosBusinessSearchUrl(
                            row.user_state_code,
                          )}
                          className="text-primary underline underline-offset-2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Look up on your state&apos;s business registry
                        </a>
                        .
                      </p>
                    ) : null}
                    {row.company_name_hint ? (
                      <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                        {COMPANY_CNAM_HINT_PREFIX}{" "}
                        <span className="text-foreground font-medium">
                          {row.company_name_hint}
                        </span>
                        . This is not verified — you will still confirm the
                        company during qualification.
                      </p>
                    ) : null}
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {row.providers.map((p) => (
                        <li
                          key={p.provider_id}
                          className="text-muted-foreground flex flex-wrap items-baseline justify-between gap-2 text-xs"
                        >
                          <span>
                            {PROVIDER_CHECK_LABEL[p.provider_id] ?? p.provider_id}
                          </span>
                          {p.status === "ok" ? (
                            <span className="text-success font-medium">
                              Received
                            </span>
                          ) : (
                            <span className="text-warning font-medium">
                              Unavailable ({p.error_code})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {continueTarget && numberChecks && !allNumberChecksExempt(numberChecks) ? (
            <div className="flex flex-col gap-3 rounded-md border border-primary/30 bg-primary/5 p-4">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Next step</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {CHECK_CONTINUE_TO_QUALIFY_HELP}
                </p>
              </div>
              <Button asChild className="w-full sm:w-auto">
                <Link
                  href={
                    continueTarget.signInHref ?? continueTarget.qualifyHref
                  }
                >
                  {continueTarget.signInHref
                    ? "Sign in to continue"
                    : CHECK_CONTINUE_TO_QUALIFY_LABEL}
                </Link>
              </Button>
            </div>
          ) : numberChecks && allNumberChecksExempt(numberChecks) ? (
            <p className="text-muted-foreground text-sm" role="status">
              This number looks TCPA-exempt. Sign in to review your saved claim
              and explore next steps.
            </p>
          ) : null}

          {requiresAccountWall ? (
            <p className="text-muted-foreground text-sm" role="status">
              You&apos;ve used your free check. Use <strong>Sign in</strong> in the
              header to continue, or check another number after creating an account.
            </p>
          ) : null}

          {!requiresAccountWall && numberChecks === null ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                disabled={
                  checkSubmitting ||
                  retryWaiting ||
                  duplicateRowIds.size > 0 ||
                  phoneRows.some((r) => rowValidityHint(r.digits) !== null) ||
                  !phoneRows.some(
                    (r) => normalizeUsPhoneToE164(r.digits) !== null,
                  )
                }
                onClick={() => void runCheckSubmit()}
              >
                {checkSubmitting || retryWaiting ? "Running check…" : "Run check"}
              </Button>
              {submitFailureCount > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={checkSubmitting || retryWaiting}
                  onClick={() =>
                    void runCheckSubmit({ isBackoffRetry: true })
                  }
                >
                  {retryWaiting
                    ? "Waiting to retry…"
                    : "Retry with backoff"}
                </Button>
              ) : null}
            </div>
          ) : null}
      </section>
    </>
  );
}
