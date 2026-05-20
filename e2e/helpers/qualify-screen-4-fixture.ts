/**
 * CI-8.5 — Seeded claim subjects for Qualify Screen 4 company-intel UX.
 */

export type QualifyScreen4E2EFixture = {
  userId: string;
  claimId: string;
  /** Lane B `running` — poll + mocked API should surface suggestion (CI-8.2.4). */
  pollingSubjectId: string;
  /** Lane B completed with no suggestion — primary voicemail CTA (CI-8.2.3). */
  voicemailCtaSubjectId: string;
};
