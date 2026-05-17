/**
 * Phase 13.2.1 — Compile evidence package PDF bytes (pdfkit).
 */

import PDFDocument from "pdfkit";

import type { EvidencePdfContext } from "./load-evidence-pdf-context";

const DISCLAIMER =
  "Informational summary prepared by RingBounty. Not legal advice. Attorneys must independently verify all facts and documents.";

function writeSectionTitle(doc: InstanceType<typeof PDFDocument>, title: string): void {
  doc.moveDown(0.5);
  doc.fontSize(12).font("Helvetica-Bold").text(title);
  doc.font("Helvetica").fontSize(10);
  doc.moveDown(0.25);
}

function writeKeyValue(
  doc: InstanceType<typeof PDFDocument>,
  label: string,
  value: string,
): void {
  doc.text(`${label}: ${value}`, { lineGap: 2 });
}

/**
 * Renders {@link EvidencePdfContext} into a PDF buffer for Storage upload.
 */
export function buildEvidencePdfBuffer(context: EvidencePdfContext): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "LETTER" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).font("Helvetica-Bold").text("RingBounty — Attorney Evidence Package");
    doc.fontSize(10).font("Helvetica");
    doc.moveDown(0.25);
    writeKeyValue(doc, "Lead ID", context.leadId);
    writeKeyValue(doc, "Claim ID", context.claimId);
    writeKeyValue(doc, "Generated", context.generatedAtIso);
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor("#444444").text(DISCLAIMER, { lineGap: 2 });
    doc.fillColor("#000000").fontSize(10);

    writeSectionTitle(doc, "Consumer contact");
    writeKeyValue(doc, "Name", context.consumer.fullName ?? "—");
    writeKeyValue(doc, "Email", context.consumer.email);
    writeKeyValue(doc, "State", context.consumer.state ?? "—");

    writeSectionTitle(doc, "Claim summary");
    writeKeyValue(doc, "Violation type", context.claim.violationType);
    writeKeyValue(doc, "Claim strength", context.claim.claimStrength ?? "—");
    writeKeyValue(doc, "Strength summary", context.claim.strengthHeadline);
    if (context.claim.valuationLow) {
      writeKeyValue(doc, "Valuation (conservative low)", context.claim.valuationLow);
    }
    if (context.claim.valuationRealistic) {
      writeKeyValue(doc, "Valuation (realistic)", context.claim.valuationRealistic);
    }
    if (context.claim.valuationHigh) {
      writeKeyValue(doc, "Valuation (maximum)", context.claim.valuationHigh);
    }

    for (const [index, subject] of context.subjects.entries()) {
      writeSectionTitle(
        doc,
        `Phone number ${index + 1}${subject.phoneNumber ? ` — ${subject.phoneNumber}` : ""}`,
      );
      writeKeyValue(doc, "Subject ID", subject.subjectId);
      writeKeyValue(doc, "Company", subject.companyName ?? "—");
      writeKeyValue(
        doc,
        "Company identified",
        subject.companyIdentified ? "Yes" : "No",
      );
      writeKeyValue(doc, "Call category", subject.callCategory ?? "—");
      writeKeyValue(doc, "Spam / reputation", subject.spamSummary);
      writeKeyValue(doc, "Do-not-call", subject.dncSummary);
      if (subject.registeredAgentName) {
        writeKeyValue(doc, "Registered agent", subject.registeredAgentName);
      }
      if (subject.registeredAgentAddress) {
        writeKeyValue(doc, "Registered agent address", subject.registeredAgentAddress);
      }
      if (subject.registeredAgentLookupSource) {
        writeKeyValue(doc, "RA lookup source", subject.registeredAgentLookupSource);
      }
      if (subject.federalDncScreenshotPath) {
        writeKeyValue(
          doc,
          "Federal DNC screenshot (storage)",
          subject.federalDncScreenshotPath,
        );
      }
      if (subject.voicemailAudioPath) {
        writeKeyValue(doc, "Voicemail audio (storage)", subject.voicemailAudioPath);
      }
    }

    if (context.qualificationLines.length > 0) {
      writeSectionTitle(doc, "Qualification answers");
      for (const line of context.qualificationLines) {
        writeKeyValue(doc, line.label, line.value);
      }
    }

    doc.end();
  });
}
