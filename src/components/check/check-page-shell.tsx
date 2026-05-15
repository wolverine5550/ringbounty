import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CheckPageShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Mobile-first max-width column for the `/check` funnel (§4.1.1).
 */
export function CheckPageShell({ children, className }: CheckPageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
