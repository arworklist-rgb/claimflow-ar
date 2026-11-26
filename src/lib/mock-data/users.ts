import type { User } from "@/lib/types";

export const SEED_USERS: User[] = [
  { id: "u-sm", name: "Sanjay Mehta", email: "sanjay.mehta@claimflow.demo", role: "Admin", status: "Active", colorIndex: 0 },
  { id: "u-ak", name: "Ananya Kapoor", email: "ananya.kapoor@claimflow.demo", role: "AR Specialist", status: "Active", colorIndex: 1 },
  { id: "u-pp", name: "Priya Patel", email: "priya.patel@claimflow.demo", role: "Billing Manager", status: "Active", colorIndex: 2 },
  { id: "u-tn", name: "Thomas Nguyen", email: "thomas.nguyen@claimflow.demo", role: "Coder", status: "Active", colorIndex: 3 },
  { id: "u-dm", name: "Daniel Morales", email: "daniel.morales@claimflow.demo", role: "AR Specialist", status: "Active", colorIndex: 4 },
  { id: "u-rs", name: "Rachel Stein", email: "rachel.stein@claimflow.demo", role: "Billing Manager", status: "Active", colorIndex: 5 },
  { id: "u-sk", name: "Samuel Kim", email: "samuel.kim@claimflow.demo", role: "Coder", status: "Active", colorIndex: 6 },
  { id: "u-lw", name: "Laura Whitfield", email: "laura.whitfield@claimflow.demo", role: "AR Specialist", status: "Active", colorIndex: 7 },
  { id: "u-mb", name: "Marcus Bell", email: "marcus.bell@claimflow.demo", role: "Admin", status: "Active", colorIndex: 8 },
  { id: "u-jo", name: "Jennifer Okafor", email: "jennifer.okafor@claimflow.demo", role: "Coder", status: "Active", colorIndex: 9 },
  { id: "u-ch", name: "Carlos Herrera", email: "carlos.herrera@claimflow.demo", role: "AR Specialist", status: "Active", colorIndex: 10 },
  { id: "u-ev", name: "Emily Vasquez", email: "emily.vasquez@claimflow.demo", role: "Billing Manager", status: "Inactive", colorIndex: 11 },
];

export const CURRENT_USER_ID = "u-sm";

/** Who the demo starts as. The user menu's "View as" switch changes this. */
export const DEFAULT_VIEW_AS_ID = CURRENT_USER_ID;
