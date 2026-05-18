import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildLoginHrefForClaim } from "@/lib/claims/gated-routes";

type AccountWallProps = {
  claimId: string;
  /** Post-login destination (gated route only; claim id appended as query). */
  returnPath?: string;
};

/**
 * Account wall (§2.5.1): shown when `isSuccessfulQuery` and the visitor is not signed in.
 */
export function AccountWall({ claimId, returnPath = "/results" }: AccountWallProps) {
  const loginHref = buildLoginHrefForClaim({ returnPath, claimId });

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-xl">Create a free account to continue</CardTitle>
        <CardDescription>
          We found a potential TCPA claim. Sign in to see your results, run qualification,
          and explore informational strength — estimates only, not legal advice.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="text-muted-foreground list-disc space-y-2 pl-5 text-sm">
          <li>Save your check and continue on any device</li>
          <li>See company matches and claim strength details</li>
          <li>Opt in to connect with a participating attorney when eligible</li>
        </ul>
        <Button asChild className="w-full">
          <Link href={loginHref}>Continue with email</Link>
        </Button>
        <p className="text-muted-foreground text-center text-xs">
          One-time magic link — no password required.
        </p>
      </CardContent>
    </Card>
  );
}
