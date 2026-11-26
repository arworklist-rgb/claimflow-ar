import type { HelpContact } from "@/lib/types";

/** Made-up numbers in the 555-01xx range, so nothing real is listed. */
export const SEED_HELP_CONTACTS: HelpContact[] = [
  {
    id: "hc-aetna",
    name: "Aetna",
    category: "Payer",
    phones: [
      { id: "p1", type: "Provider Services", number: "(800) 555-0101", ext: "2" },
      { id: "p2", type: "Claims", number: "(800) 555-0102" },
      { id: "p3", type: "Fax", number: "(800) 555-0103" },
    ],
    email: "providerhelp@aetna.example",
    website: "https://www.aetna.com",
    hours: "Mon–Fri, 8am–6pm ET",
    notes: "Timely filing is 120 days from the date of service. Have the claim no and member ID ready before calling.",
  },
  {
    id: "hc-uhc",
    name: "UnitedHealthcare",
    category: "Payer",
    phones: [
      { id: "p1", type: "Provider Services", number: "(877) 555-0111" },
      { id: "p2", type: "Eligibility", number: "(877) 555-0112" },
      { id: "p3", type: "Fax", number: "(877) 555-0113" },
    ],
    email: "provider.support@uhc.example",
    website: "https://www.uhcprovider.com",
    hours: "Mon–Fri, 7am–7pm CT",
    notes: "Appeals go through the provider portal. Reconsideration window is 180 days from the denial.",
  },
  {
    id: "hc-bcbs",
    name: "Blue Cross Blue Shield",
    category: "Payer",
    phones: [
      { id: "p1", type: "Provider Services", number: "(800) 555-0121" },
      { id: "p2", type: "Prior Authorization", number: "(800) 555-0122", ext: "4" },
    ],
    website: "https://www.bcbs.com",
    hours: "Mon–Fri, 8am–5pm local",
    notes: "Plans differ by state. Check the member ID prefix to find the right regional line.",
  },
  {
    id: "hc-cigna",
    name: "Cigna",
    category: "Payer",
    phones: [
      { id: "p1", type: "Provider Services", number: "(800) 555-0131" },
      { id: "p2", type: "Claims", number: "(800) 555-0132" },
      { id: "p3", type: "Fax", number: "(800) 555-0133" },
    ],
    email: "providers@cigna.example",
    website: "https://cignaforhcp.cigna.com",
    hours: "Mon–Fri, 8am–8pm ET",
  },
  {
    id: "hc-medicare",
    name: "Medicare (MAC)",
    category: "Payer",
    phones: [
      { id: "p1", type: "Provider Contact Center", number: "(866) 555-0141" },
      { id: "p2", type: "Appeals", number: "(866) 555-0142" },
    ],
    website: "https://www.cms.gov",
    hours: "Mon–Fri, 8am–4pm local",
    notes: "Timely filing is 12 months from the date of service. Redetermination requests are due within 120 days.",
  },
  {
    id: "hc-humana",
    name: "Humana",
    category: "Payer",
    phones: [
      { id: "p1", type: "Provider Services", number: "(800) 555-0151" },
      { id: "p2", type: "Fax", number: "(800) 555-0153" },
    ],
    email: "providerrelations@humana.example",
    website: "https://www.humana.com/provider",
    hours: "Mon–Fri, 8am–7pm ET",
  },
  {
    id: "hc-availity",
    name: "Availity",
    category: "Clearinghouse",
    phones: [
      { id: "p1", type: "Client Services", number: "(800) 555-0161" },
      { id: "p2", type: "Technical Support", number: "(800) 555-0162", ext: "3" },
    ],
    email: "support@availity.example",
    website: "https://www.availity.com",
    hours: "Mon–Fri, 8am–8pm ET",
    notes: "Use for eligibility checks, claim status and ERA downloads. Ask for a ticket number on every call.",
  },
  {
    id: "hc-billing-manager",
    name: "Priya Patel — Billing Manager",
    category: "Internal",
    phones: [
      { id: "p1", type: "Desk", number: "(555) 010-0171", ext: "210" },
      { id: "p2", type: "Mobile", number: "(555) 010-0172" },
    ],
    email: "priya.patel@claimflow.demo",
    hours: "Mon–Fri, 9am–5pm",
    notes: "Escalate write-offs over $500 and any payer dispute older than 90 days.",
  },
];
