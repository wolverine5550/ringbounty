import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

function isPkceVerifierError(message: string | undefined): boolean {
  if (!message) return false;
  return message.toLowerCase().includes("pkce code verifier");
}

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params?.error;
  const pkceMismatch = isPkceVerifierError(errorMessage);

  return (
    <>
      {errorMessage ? (
        <p className="text-sm text-muted-foreground">
          {pkceMismatch
            ? "Your sign-in link must be opened in the same browser where you requested it."
            : `Code error: ${errorMessage}`}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          An unspecified error occurred.
        </p>
      )}
      {pkceMismatch ? (
        <ol className="text-muted-foreground mt-4 list-decimal space-y-2 pl-5 text-sm">
          <li>
            In <strong>this</strong> browser tab, go back to{" "}
            <Link href="/login" className="text-primary underline">
              Sign in
            </Link>{" "}
            and send a new magic link to your email.
          </li>
          <li>Click the new link in this same browser (not another device or profile).</li>
          <li>
            If you use Gmail, right-click the link and choose &quot;Open in
            [your browser]&quot; so it does not open in a different app.
          </li>
        </ol>
      ) : null}
      <Button asChild className="mt-6 w-full" variant="outline">
        <Link href="/login">Try sign-in again</Link>
      </Button>
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Sorry, something went wrong.
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense>
                <ErrorContent searchParams={searchParams} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
