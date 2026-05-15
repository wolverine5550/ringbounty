import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type LandingSectionProps = {
  id?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Alternate background band (wireframe section rhythm). */
  variant?: "default" | "muted";
};

/** Shared max-width wrapper for homepage sections. */
export function LandingSection({
  id,
  title,
  description,
  children,
  className,
  variant = "default",
}: LandingSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20 px-4 py-14 sm:scroll-mt-24 sm:py-20",
        variant === "muted" && "border-y border-border bg-muted/25",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl">
        {(title || description) && (
          <header className="mb-10 flex max-w-2xl flex-col gap-3">
            {title ? (
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                {description}
              </p>
            ) : null}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
