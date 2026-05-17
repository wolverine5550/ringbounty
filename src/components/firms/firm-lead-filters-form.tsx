"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FirmLeadFilters } from "@/lib/firms/firm-lead-filters";

type FirmLeadFiltersFormProps = {
  initial: FirmLeadFilters;
};

const STRENGTH_OPTIONS = [
  { value: "", label: "Any strength" },
  { value: "strong", label: "Strong" },
  { value: "moderate", label: "Moderate" },
  { value: "weak", label: "Weak" },
  { value: "ineligible", label: "Ineligible" },
];

/**
 * Updates `/firms/leads` query params for server + client filtering (§13.4.3).
 */
export function FirmLeadFiltersForm({ initial }: FirmLeadFiltersFormProps) {
  const router = useRouter();

  return (
    <form
      className="grid gap-4 rounded-lg border p-4 md:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const params = new URLSearchParams();
        const state = String(form.get("state") ?? "").trim();
        const minValue = String(form.get("min_value") ?? "").trim();
        const strength = String(form.get("strength") ?? "").trim();

        if (state) params.set("state", state.toUpperCase());
        if (minValue) params.set("min_value", String(Number(minValue) * 100));
        if (strength) params.set("strength", strength);

        const qs = params.toString();
        router.push(qs ? `/firms/leads?${qs}` : "/firms/leads");
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="state">State (US)</Label>
        <Input
          id="state"
          name="state"
          placeholder="TX"
          maxLength={2}
          defaultValue={initial.state ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="min_value">Min value (USD)</Label>
        <Input
          id="min_value"
          name="min_value"
          type="number"
          min={0}
          step={100}
          placeholder="500"
          defaultValue={
            initial.minValueCents != null
              ? String(Math.round(initial.minValueCents / 100))
              : ""
          }
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="strength">Strength</Label>
        <select
          id="strength"
          name="strength"
          defaultValue={initial.strength ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {STRENGTH_OPTIONS.map((opt) => (
            <option key={opt.value || "any"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-2">
        <Button type="submit" className="w-full">
          Apply filters
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/firms/leads")}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
