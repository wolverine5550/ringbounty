/**
 * §2.7.4 — Optional CAPTCHA hook after threshold (stub until provider is chosen).
 */

export type CaptchaVerifyInput = {
  token: string | null;
  remoteIp?: string;
};

export type CaptchaVerifier = {
  readonly enabled: boolean;
  verify(input: CaptchaVerifyInput): Promise<boolean>;
};

/** No-op verifier used when CAPTCHA is not configured. */
export const noopCaptchaVerifier: CaptchaVerifier = {
  enabled: false,
  async verify() {
    return true;
  },
};

/**
 * Returns whether a CAPTCHA token must be supplied before continuing.
 * Wire to env + abuse heuristics when a provider is integrated.
 */
export function requiresCaptcha(context: {
  action: string;
  currentCount: number;
  threshold?: number;
}): boolean {
  void context;
  return false;
}
