import {
  ATTORNEY_SHARING_CHECKLIST_HEADLINE,
  ATTORNEY_SHARING_CHECKLIST_INTRO,
  ATTORNEY_SHARING_CHECKLIST_ITEMS,
} from "@/lib/constants/attorney-sharing-checklist";

/**
 * Phase 13.2.4 — User-facing transparency before attorney referral.
 */
export function AttorneySharingChecklist() {
  return (
    <section className="flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <h2 className="text-sm font-medium">{ATTORNEY_SHARING_CHECKLIST_HEADLINE}</h2>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          {ATTORNEY_SHARING_CHECKLIST_INTRO}
        </p>
      </div>
      <ul className="flex flex-col gap-2 text-sm leading-snug">
        {ATTORNEY_SHARING_CHECKLIST_ITEMS.map((item) => (
          <li key={item.id} className="flex gap-2">
            <span className="text-muted-foreground mt-0.5 shrink-0" aria-hidden>
              •
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
