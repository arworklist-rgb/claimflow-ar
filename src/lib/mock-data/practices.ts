import type { Practice } from "@/lib/types";

export const SEED_PRACTICES: Practice[] = [
  {
    id: "p-1001",
    code: "PR-1001",
    name: "Lakeshore Family Medicine",
    npi: "1457392086",
    softwareId: "sw-standard",
    status: "Active",
    userIds: ["u-ak", "u-pp", "u-tn"],
    createdAt: "2026-04-10",
  },
  {
    id: "p-1002",
    code: "PR-1002",
    name: "Riverside Medical Group",
    npi: "1962845307",
    status: "Active",
    userIds: ["u-pp", "u-dm"],
    createdAt: "2026-03-28",
  },
  {
    id: "p-1003",
    code: "PR-1003",
    name: "Pinecrest Health Clinic",
    npi: "1740618259",
    status: "Active",
    userIds: ["u-rs", "u-sk", "u-lw"],
    createdAt: "2026-03-15",
  },
];
