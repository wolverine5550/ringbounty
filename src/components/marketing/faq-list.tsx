import type { FaqEntry } from "@/lib/marketing/faq";

type FaqListProps = {
  entries: readonly FaqEntry[];
};

/** Accessible FAQ list (§3.3). */
export function FaqList({ entries }: FaqListProps) {
  return (
    <div className="flex flex-col gap-10">
      {entries.map((entry) => (
        <section
          key={entry.id}
          id={entry.id}
          className="flex scroll-mt-20 flex-col gap-2"
          aria-labelledby={`${entry.id}-question`}
        >
          <h2 id={`${entry.id}-question`} className="text-lg font-medium">
            {entry.question}
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {entry.answer}
          </p>
        </section>
      ))}
    </div>
  );
}
