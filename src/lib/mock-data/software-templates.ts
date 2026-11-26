import type { Software, SoftwareColumn } from "@/lib/types";

const col = (id: string, header: string, field: string, opts: { required?: boolean; aliases?: string[] } = {}): SoftwareColumn => ({
  id,
  header,
  field,
  required: opts.required ?? false,
  aliases: opts.aliases ?? [],
});

/**
 * Billing softwares and the template each one exports. "Standard" is the client's own New Worklist template;
 * the others show the same data under different column names, in a different order, with different extras.
 */
export const SEED_SOFTWARES: Software[] = [
  {
    id: "sw-standard",
    name: "Standard (ClaimFlow)",
    status: "Active",
    columns: [
      col("c1", "Patient Name", "patientName", { required: true }),
      col("c2", "Claim No", "claimId", { required: true, aliases: ["Claim Number", "Claim ID"] }),
      col("c3", "Claim Date", "claimDate"),
      col("c4", "Responsible", "responsible", { aliases: ["Payer"] }),
      col("c5", "Provider", "provider"),
      col("c6", "Service date", "dos", { required: true, aliases: ["DOS", "Date of Service"] }),
      col("c7", "Billed date", "billedDate"),
      col("c8", "aging", "aging", { aliases: ["Age", "Days in AR"] }),
      col("c9", "Procedure", "cpt", { aliases: ["CPT", "Procedure Code"] }),
      col("c10", "Charge", "billedAmount", { aliases: ["Charges", "Billed Amount"] }),
      col("c11", "Balance", "balance"),
    ],
  },
  {
    id: "sw-kareo",
    name: "Kareo / Tebra",
    status: "Active",
    columns: [
      col("k1", "Patient", "patientName", { required: true, aliases: ["Patient Name"] }),
      col("k2", "Patient Acct No", "patientAcctNo"),
      col("k3", "Claim #", "claimId", { required: true, aliases: ["Claim Number"] }),
      col("k4", "Claim Created", "claimDate"),
      col("k5", "Primary Payer", "responsible", { aliases: ["Payer"] }),
      col("k6", "Rendering Provider", "provider"),
      col("k7", "DOS", "dos", { required: true, aliases: ["Date of Service"] }),
      col("k8", "Billed Date", "billedDate"),
      col("k9", "Days in AR", "aging"),
      col("k10", "CPT", "cpt", { aliases: ["CPT Code"] }),
      col("k11", "Total Charge", "billedAmount"),
      col("k12", "Balance Due", "balance"),
    ],
  },
  {
    id: "sw-amd",
    name: "AdvancedMD",
    status: "Active",
    columns: [
      col("a1", "Account", "account"),
      col("a2", "Patient Name", "patientName", { required: true }),
      col("a3", "Patient Acct No", "patientAcctNo"),
      col("a4", "Claim ID", "claimId", { required: true }),
      col("a5", "Claim Date", "claimDate"),
      col("a6", "Responsible", "responsible"),
      col("a7", "Provider", "provider"),
      col("a8", "Service Date", "dos", { required: true }),
      col("a9", "Billed Date", "billedDate"),
      col("a10", "Aging", "aging"),
      col("a11", "Procedure", "cpt"),
      col("a12", "Charge", "billedAmount"),
      col("a13", "Balance", "balance"),
      col("a14", "Paid Amount", "paidAmount"),
    ],
  },
  {
    id: "sw-athena",
    name: "athenaOne",
    status: "Active",
    columns: [
      col("h1", "Patient", "patientName", { required: true }),
      col("h2", "Claim No", "claimId", { required: true }),
      col("h3", "Svc Date", "dos", { required: true, aliases: ["Service Date"] }),
      col("h4", "Payer", "responsible"),
      col("h5", "Provider", "provider"),
      col("h6", "Procedure Code", "cpt"),
      col("h7", "Charges", "billedAmount"),
      col("h8", "Outstanding", "balance"),
    ],
  },
];
