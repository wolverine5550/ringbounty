/**
 * Phase 7.5.4 — OpenRouter STT + structured company extraction from voicemail.
 *
 * @see https://openrouter.ai/docs/guides/overview/multimodal/stt
 */

/** Whisper model for `/api/v1/audio/transcriptions`. */
export const OPENROUTER_WHISPER_MODEL = "openai/whisper-large-v3";

/** Chat model for JSON extraction from transcript. */
export const OPENROUTER_VOICEMAIL_EXTRACT_MODEL = "openai/gpt-4o-mini";

export type VoicemailCompanyExtraction = {
  companyName: string | null;
  callbackPhone: string | null;
  productPitch: string | null;
};

export function getOpenRouterApiKey(): string | undefined {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  return key && key.length > 0 ? key : undefined;
}

/**
 * Transcribes base64 audio via OpenRouter STT endpoint.
 */
export async function transcribeVoicemailWithOpenRouter(params: {
  base64Audio: string;
  format: string;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    return { ok: false, error: "OPENROUTER_API_KEY is not configured" };
  }

  const response = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_WHISPER_MODEL,
      input_audio: {
        data: params.base64Audio,
        format: params.format,
      },
      language: "en",
    }),
  });

  const parsed = (await response.json()) as { text?: string; error?: { message?: string } };

  if (!response.ok) {
    return {
      ok: false,
      error: parsed.error?.message ?? "Transcription request failed",
    };
  }

  const text = typeof parsed.text === "string" ? parsed.text.trim() : "";
  if (!text) {
    return { ok: false, error: "Transcription returned no text" };
  }

  return { ok: true, text };
}

/**
 * Extracts company fields from transcript (JSON object response).
 */
export async function extractCompanyFromVoicemailTranscript(
  transcript: string,
): Promise<{ ok: true; value: VoicemailCompanyExtraction } | { ok: false; error: string }> {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    return { ok: false, error: "OPENROUTER_API_KEY is not configured" };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_VOICEMAIL_EXTRACT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract telemarketing voicemail facts. Reply with JSON only: company_name (string|null), callback_phone (string|null), product_pitch (string|null). Use null when unknown. company_name should be a plausible business name, not a generic phrase.",
        },
        { role: "user", content: transcript },
      ],
    }),
  });

  const parsed = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    return {
      ok: false,
      error: parsed.error?.message ?? "Extraction request failed",
    };
  }

  const content = parsed.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    return { ok: false, error: "Extraction returned no content" };
  }

  try {
    const json = JSON.parse(content) as Record<string, unknown>;
    return {
      ok: true,
      value: {
        companyName: normalizeOptionalString(json.company_name),
        callbackPhone: normalizeOptionalString(json.callback_phone),
        productPitch: normalizeOptionalString(json.product_pitch),
      },
    };
  } catch {
    return { ok: false, error: "Could not parse extraction JSON" };
  }
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
