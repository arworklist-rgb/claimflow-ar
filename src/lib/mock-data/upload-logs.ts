import type { UploadLog } from "@/lib/types";

export const SEED_UPLOAD_LOGS: UploadLog[] = [
  {
    id: "up-3",
    fileName: "pinecrest_denials_apr.xlsx",
    type: "New",
    practiceName: "Pinecrest Health Clinic",
    rows: 212,
    uploadedBy: "Rachel Stein",
    uploadedAt: "2026-04-14T15:42:00Z",
    status: "Completed",
  },
  {
    id: "up-2",
    fileName: "riverside_paid_remits_w15.xlsx",
    type: "Paid",
    practiceName: "—",
    rows: 87,
    uploadedBy: "Daniel Morales",
    uploadedAt: "2026-04-13T10:05:00Z",
    status: "Completed with warnings",
  },
  {
    id: "up-1",
    fileName: "lakeshore_denials_w14.xlsx",
    type: "New",
    practiceName: "Lakeshore Family Medicine",
    rows: 148,
    uploadedBy: "Ananya Kapoor",
    uploadedAt: "2026-04-11T09:18:00Z",
    status: "Completed",
  },
];
