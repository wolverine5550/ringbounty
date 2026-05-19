/**
 * CI-4.2 — OpenRouter synthesis from accumulated Lane B sources + SerpAPI snippets.
 *
 * Structured JSON: company_name, confidence, reasoning, call_category, callback_numbers,
 * is_spoofed_pool, contradictions. Retries once on malformed model output (CI-4.2.3).
 */

import {
  formatUsPhoneMask,
  normalizeNanp10Key,
  normalizeUsPhoneToE164,
} from "@/lib/check/us-phone";
import { getOpenRouterApiKey } from "@/lib/company/openrouter-voicemail";
import { isSubstantiveCompanyName } from "@/lib/constants/company-identification";
import {
  CALL_CATEGORY_VALUES,
  isCallCategory,
} from "@/lib/constants/claimSubject";

import type { CompanyIntelligenceEnv } from "./company-intelligence-flags";
import { redactPhonePiiForLog } from "./sources/serpapi-complaint-search";
import type { SerpapiComplaintSnippet } from "./sources/serpapi-complaint-search";
import type { IntelSourceHit, SynthesisResult } from "./types";

export const COMPANY_INTEL_OPENROUTER_MODEL_ENV_KEY =
  "COMPANY_INTEL_OPENROUTER_MODEL" as const;

/** Sonnet-class default for company synthesis (CI-4.2.2). */
export const DEFAULT_COMPANY_INTEL_OPENROUTER_MODEL =
  "anthropic/claude-sonnet-4" as const;

export const OPENROUTER_CHAT_COMPLETIONS_URL =
  "https://openrouter.ai/api/v1/chat/completions" as const;

export const DEFAULT_SYNTHESIS_TIMEOUT_MS = 30_000;

/** Max OpenRouter attempts when JSON is malformed (initial + 1 retry per CI-4.2.3). */
export const SYNTHESIS_MAX_PARSE_ATTEMPTS = 2;

/** Raw model JSON shape (snake_case per CI-4.2.1). */
export type OpenRouterSynthesisJson = {
  company_name: string | null;
  confidence: number;
  reasoning: string;
  call_category: string | null;
  callback_numbers: string[];
  is_spoofed_pool: boolean;
  contradictions: string | null;
};

export type SynthesizeCompanyFromSourcesInput = {
  phoneNumberNormalized: string;
  sources: IntelSourceHit[];
  serpapiSnippets?: SerpapiComplaintSnippet[];
};

export type SynthesizeCompanySkippedReason =
  | "missing_credentials"
  | "insufficient_context"
  | "http_error"
  | "parse_error";

export type SynthesizeCompanyFromSourcesOptions = {
  env?: CompanyIntelligenceEnv;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export type SynthesizeCompanyFromSourcesSuccess = {
  ok: true;
  synthesis: SynthesisResult;
  prompt: string;
  response: string;
};

export type SynthesizeCompanyFromSourcesFailure = {
  ok: false;
  skippedReason: SynthesizeCompanySkippedReason;
  error?: string;
};

export type SynthesizeCompanyFromSourcesResult =
  | SynthesizeCompanyFromSourcesSuccess
  | SynthesizeCompanyFromSourcesFailure;

const SYSTEM_PROMPT = `You synthesize telemarketing/spam intelligence for a TCPA claims product.
Reply with a single JSON object only (no markdown). Use these keys exactly:
company_name (string|null), confidence (integer 0-100), reasoning (string),
call_category (one of: ${CALL_CATEGORY_VALUES.join(", ")} or null),
callback_numbers (string[] of E.164 +1... when known, else []),
is_spoofed_pool (boolean), contradictions (string|null).

Rules:
- company_name must be a plausible legal/business entity, not "Unknown", "Spam", or generic phrases.
- confidence reflects how strongly sources agree on the defendant company (not spam likelihood alone).
- Set is_spoofed_pool true when evidence suggests rotating/spoofed VOIP with no stable defendant.
- List contradictions when sources disagree on company name or call type; otherwise null.
- Suggest-only output; be conservative on confidence when evidence is thin.`;

/**
 * Resolves OpenRouter model id for company synthesis (CI-4.2.2).
 */
export function getCompanyIntelOpenRouterModel(
  env: CompanyIntelligenceEnv = process.env,
): string {
  const configured = env[COMPANY_INTEL_OPENROUTER_MODEL_ENV_KEY]?.trim();
  return configured && configured.length > 0
    ? configured
    : DEFAULT_COMPANY_INTEL_OPENROUTER_MODEL;
}

/**
 * Builds the user prompt payload sent to OpenRouter (phone + sources + SerpAPI snippets).
 */
export function buildSynthesisUserPrompt(
  input: SynthesizeCompanyFromSourcesInput,
): string {
  const ten = normalizeNanp10Key(input.phoneNumberNormalized);
  const phoneDisplay = ten ? formatUsPhoneMask(ten) : input.phoneNumberNormalized;

  const payload = {
    screened_number_display: phoneDisplay,
    sources: input.sources.map((s) => ({
      tier: s.tier,
      company_name: s.companyName,
      confidence: s.confidence ?? null,
    })),
    serpapi_snippets: (input.serpapiSnippets ?? []).map((s) => ({
      position: s.position,
      title: s.title,
      link: s.link,
      snippet: s.snippet,
    })),
  };

  return JSON.stringify(payload, null, 2);
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeCallbackNumbers(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }
    const e164 = normalizeUsPhoneToE164(item);
    if (e164 && !out.includes(e164)) {
      out.push(e164);
    }
  }
  return out;
}

function clampConfidence(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

/**
 * Parses and validates OpenRouter JSON output (CI-4.2.3).
 */
export function parseAndValidateSynthesisJson(
  content: string,
): SynthesisResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const row = parsed as Record<string, unknown>;
  const rawName = normalizeOptionalString(row.company_name);
  const companyName =
    rawName !== null && isSubstantiveCompanyName(rawName) ? rawName : null;

  const reasoning = normalizeOptionalString(row.reasoning);
  if (!reasoning) {
    return null;
  }

  const rawCategory = normalizeOptionalString(row.call_category);
  const callCategory =
    rawCategory !== null && isCallCategory(rawCategory) ? rawCategory : null;

  const contradictions = normalizeOptionalString(row.contradictions);

  return {
    companyName,
    confidence: clampConfidence(row.confidence),
    reasoning,
    callCategory,
    callbackNumbers: normalizeCallbackNumbers(row.callback_numbers),
    isSpoofedPool: row.is_spoofed_pool === true,
    contradictions,
  };
}

function hasSynthesisContext(input: SynthesizeCompanyFromSourcesInput): boolean {
  if (input.sources.length > 0) {
    return true;
  }
  return (input.serpapiSnippets?.length ?? 0) > 0;
}

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

async function requestOpenRouterSynthesis(params: {
  apiKey: string;
  model: string;
  userPrompt: string;
  fetchImpl: typeof fetch;
  timeoutMs: number;
}): Promise<
  | { ok: true; content: string }
  | { ok: false; reason: "http_error" | "parse_error"; error: string }
> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const response = await params.fetchImpl(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: params.userPrompt },
        ],
      }),
    });

    const parsed = (await response.json()) as ChatCompletionResponse;

    if (!response.ok) {
      const message = parsed.error?.message ?? `HTTP ${response.status}`;
      console.error(
        "[synthesize-company-from-sources]",
        redactPhonePiiForLog(`OpenRouter error: ${message}`),
      );
      return { ok: false, reason: "http_error", error: message };
    }

    const content = parsed.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return { ok: false, reason: "parse_error", error: "empty_content" };
    }

    return { ok: true, content: content.trim() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error(
      "[synthesize-company-from-sources]",
      redactPhonePiiForLog(`fetch failed: ${message}`),
    );
    return { ok: false, reason: "http_error", error: message };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * CI-4.2.1 — Calls OpenRouter to synthesize company intelligence from sources[].
 */
export async function synthesizeCompanyFromSources(
  input: SynthesizeCompanyFromSourcesInput,
  options: SynthesizeCompanyFromSourcesOptions = {},
): Promise<SynthesizeCompanyFromSourcesResult> {
  const env = options.env ?? process.env;
  const apiKey = options.apiKey ?? getOpenRouterApiKey();

  if (!apiKey) {
    return { ok: false, skippedReason: "missing_credentials" };
  }

  if (!hasSynthesisContext(input)) {
    return { ok: false, skippedReason: "insufficient_context" };
  }

  const model = options.model ?? getCompanyIntelOpenRouterModel(env);
  const userPrompt = buildSynthesisUserPrompt(input);
  const fullPrompt = `${SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`;
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_SYNTHESIS_TIMEOUT_MS;

  let lastContent: string | null = null;

  for (let attempt = 0; attempt < SYNTHESIS_MAX_PARSE_ATTEMPTS; attempt++) {
    const chat = await requestOpenRouterSynthesis({
      apiKey,
      model,
      userPrompt,
      fetchImpl,
      timeoutMs,
    });

    if (!chat.ok) {
      return {
        ok: false,
        skippedReason: chat.reason,
        error: chat.error,
      };
    }

    lastContent = chat.content;
    const synthesis = parseAndValidateSynthesisJson(chat.content);
    if (synthesis) {
      return {
        ok: true,
        synthesis,
        prompt: fullPrompt,
        response: chat.content,
      };
    }
  }

  return {
    ok: false,
    skippedReason: "parse_error",
    error: lastContent ? "invalid_json_after_retry" : "no_content",
  };
}

/**
 * Maps synthesis success to orchestrator hit + raw_results slice.
 */
export function synthesisResultToRound4Payload(result: SynthesizeCompanyFromSourcesSuccess): {
  hit: IntelSourceHit;
  rawResultsSlice: Record<string, unknown>;
  auditSkippedReason: null;
} {
  return {
    hit: {
      tier: "openrouter_synthesis",
      companyName: result.synthesis.companyName,
      confidence: result.synthesis.confidence,
    },
    rawResultsSlice: {
      openrouter: {
        model_response: JSON.parse(result.response) as Record<string, unknown>,
        synthesis: {
          company_name: result.synthesis.companyName,
          confidence: result.synthesis.confidence,
          call_category: result.synthesis.callCategory ?? null,
          is_spoofed_pool: result.synthesis.isSpoofedPool,
          callback_numbers: result.synthesis.callbackNumbers,
          contradictions: result.synthesis.contradictions ?? null,
        },
      },
    },
    auditSkippedReason: null,
  };
}
