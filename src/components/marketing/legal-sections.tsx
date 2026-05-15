import type { LegalSection } from "@/lib/marketing/privacy";

type LegalSectionsProps = {
  sections: readonly LegalSection[];
};

/** Renders titled policy sections with anchor ids. */
export function LegalSections({ sections }: LegalSectionsProps) {
  return (
    <div className="flex flex-col gap-10">
      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="flex scroll-mt-20 flex-col gap-3"
          aria-labelledby={`${section.id}-heading`}
        >
          <h2 id={`${section.id}-heading`} className="text-xl font-medium">
            {section.title}
          </h2>
          {section.paragraphs.map((paragraph, index) => (
            <p
              key={`${section.id}-${index}`}
              className="text-muted-foreground text-sm leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}
