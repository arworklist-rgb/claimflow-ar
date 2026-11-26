import type { KnowledgeDoc } from "@/lib/types";
import { hasKnowledgeFile, saveKnowledgeFile } from "./file-store";
import { mimeOf } from "./files";

/**
 * The seeded Knowledge Center documents are real files, generated in the browser the first time the page is
 * opened: two Excel workbooks (SheetJS), a Word document (a minimal .docx built with JSZip) and a one-page PDF
 * written by hand. They are stored in IndexedDB like any upload.
 */

async function workbook(sheets: { name: string; rows: (string | number)[][]; widths?: number[] }[]): Promise<Blob> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(s.rows);
    if (s.widths) ws["!cols"] = s.widths.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, s.name);
  }
  const bytes = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Blob([bytes], { type: mimeOf("xlsx") });
}

const makeTimelyFiling = () =>
  workbook([
    {
      name: "Filing limits",
      widths: [24, 20, 18, 22, 46],
      rows: [
        ["Payer", "Initial filing (days from DOS)", "Appeal window (days)", "Corrected claim (days)", "Notes"],
        ["Aetna", 120, 180, 180, "Resubmit with the original claim number."],
        ["UnitedHealthcare", 90, 180, 180, "Appeals go through the provider portal."],
        ["Blue Cross Blue Shield", 180, 180, 365, "Varies by state plan; check the member ID prefix."],
        ["Cigna", 180, 180, 180, "Reconsideration must include the denial letter."],
        ["Medicare (MAC)", 365, 120, 365, "Redetermination requests are due within 120 days."],
        ["Humana", 180, 180, 180, "Fax appeals to the number on the HelpDesk card."],
      ],
    },
    {
      name: "How to use",
      widths: [90],
      rows: [
        ["Check the deadline before working an old denial: if it is past the filing limit, escalate to the billing manager."],
        ["Limits are counted from the date of service unless the payer's contract says otherwise."],
        ["These figures are sample data for the demo."],
      ],
    },
  ]);

const makeOnboarding = () =>
  workbook([
    {
      name: "Plan",
      widths: [10, 40, 22, 14],
      rows: [
        ["Week", "Focus", "Owner", "Status"],
        [1, "System tour: worklist, uploads and HelpDesk", "Rachel Stein", "Done"],
        [2, "Denial codes and the standard follow-up steps", "Ananya Kapoor", "In progress"],
        [3, "Working payer calls with a buddy", "Daniel Morales", "Planned"],
        [4, "Appeals and corrected claims", "Priya Patel", "Planned"],
      ],
    },
  ]);

async function makeDocx(): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const p = (text: string, style?: string) =>
    `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}<w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
  const body = [
    p("Denial follow-up SOP", "Heading1"),
    p("Purpose", "Heading2"),
    p("A consistent process for working a denied claim from the first touch to resolution, so nothing sits unworked."),
    p("Steps", "Heading2"),
    p("1. Open the claim from the worklist and read the denial codes and history."),
    p("2. Check the payer's filing and appeal limits in the Knowledge Center."),
    p("3. Fix and resubmit if it is a billing error; call the payer from the HelpDesk list if it is not."),
    p("4. Set the Action and Submitted Status, and leave a comment saying what you did and the next step."),
    p("5. When the payment posts, upload the paid file so the claim closes as Paid and closed."),
    p("Escalation", "Heading2"),
    p("Escalate write-offs over $500 and any payer dispute older than 90 days to the billing manager."),
  ].join("");

  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
  );
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  );
  zip.file(
    "word/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style></w:styles>`,
  );
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`,
  );
  const bytes = await zip.generateAsync({ type: "uint8array" });
  return new Blob([bytes as BlobPart], { type: mimeOf("docx") });
}

/** A valid one-page PDF made of plain text (Helvetica), with the cross-reference offsets worked out by hand. */
function makePdf(title: string, lines: string[]): Blob {
  const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const content = [
    "BT",
    "/F1 20 Tf",
    "72 740 Td",
    `(${esc(title)}) Tj`,
    "/F1 12 Tf",
    "0 -30 Td",
    "16 TL",
    ...lines.map((l) => `(${esc(l)}) '`),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 4 0 R >> >> >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => (pdf += `${String(o).padStart(10, "0")} 00000 n \n`));
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: mimeOf("pdf") });
}

const makeAppealChecklist = () =>
  makePdf("Appeal letter checklist", [
    "Every payer appeal should include:",
    "",
    "[ ] Patient name, date of birth and member ID",
    "[ ] Claim number, date of service and billed amount",
    "[ ] The denial code and the date of the denial letter",
    "[ ] A short, specific reason the denial is wrong",
    "[ ] Supporting records (notes, authorization, itemized bill)",
    "[ ] Provider name, NPI and a contact for questions",
    "[ ] Sent before the payer's appeal deadline",
    "",
    "Sample document for the ClaimFlow AR demo.",
  ]);

const GENERATORS: Record<string, () => Promise<Blob> | Blob> = {
  "kd-timely-filing": makeTimelyFiling,
  "kd-followup-sop": makeDocx,
  "kd-appeal-letter": makeAppealChecklist,
  "kd-onboarding": makeOnboarding,
};

/** Generates any seeded document whose file isn't in IndexedDB yet. Returns the sizes it created. */
export async function ensureSeedFiles(docs: KnowledgeDoc[]): Promise<{ id: string; size: number }[]> {
  const created: { id: string; size: number }[] = [];
  for (const doc of docs) {
    const make = doc.seed ? GENERATORS[doc.id] : undefined;
    if (!make || (await hasKnowledgeFile(doc.id))) continue;
    const blob = await make();
    await saveKnowledgeFile(doc.id, blob);
    created.push({ id: doc.id, size: blob.size });
  }
  return created;
}
