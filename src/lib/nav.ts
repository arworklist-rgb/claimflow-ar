import {
  Activity,
  Bell,
  Building2,
  BookOpen,
  CalendarClock,
  ChartColumn,
  FileSpreadsheet,
  Home,
  Landmark,
  Layers,
  LifeBuoy,
  ListChecks,
  Plug,
  Receipt,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Tag,
  Upload,
  UserCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { RoleKey } from "@/server/auth/rbac";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: string;
  collapsible?: boolean;
  permission?: string;
  roles?: RoleKey[];
}

export interface SidebarSection {
  title: string;
  items: NavItem[];
}

/** Top Navbar section dropdowns (everything except Settings, which lives in the Profile dropdown). */
export const TOP_NAV_SECTIONS: SidebarSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: Home },
    ],
  },
  {
    title: "Claims Operations",
    items: [
      { href: "/upload-claims", label: "Upload Claims", icon: Upload, permission: "claims.import" },
      { href: "/worklist", label: "Worklist", icon: ListChecks, permission: "claims.read" },
      { href: "/ar-management", label: "AR Management", icon: UserCog, permission: "claims.write" },
      { href: "/reconciliation", label: "Payment Reconciliation", icon: Receipt, permission: "claims.write" },
    ],
  },
  {
    title: "Team Management",
    items: [
      { href: "/ar-management?tab=assignments", label: "AR Assignments", icon: UserCheck, permission: "claims.assign" },
      { href: "/ar-management?tab=followups", label: "Follow-up Tasks", icon: CalendarClock, permission: "claims.write" },
      { href: "/ar-management?tab=escalations", label: "Escalations", icon: ShieldAlert, permission: "claims.write" },
      { href: "/reporting?group=ar1", label: "Team Performance", icon: Activity, permission: "reports.view" },
    ],
  },
  {
    title: "Directories",
    items: [
      { href: "/settings/practices", label: "Practices", icon: Building2, permission: "practices.manage" },
      { href: "/settings/payers", label: "Payers", icon: ShieldCheck, permission: "claims.read" },
      { href: "/settings/denial-codes", label: "Denial Codes", icon: Tag, permission: "claims.read" },
      { href: "/helpdesk", label: "HelpDesk", icon: LifeBuoy, permission: "claims.read" },
    ],
  },
  {
    title: "Resources",
    items: [
      { href: "/knowledge-center", label: "Knowledge Center", icon: BookOpen, permission: "documents.read" },
      { href: "/settings/upload-templates", label: "Worklist Settings", icon: FileSpreadsheet, permission: "templates.manage" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { href: "/reporting", label: "Reporting", icon: ChartColumn, permission: "reports.view" },
    ],
  },
  {
    title: "Platform",
    items: [
      { href: "/platform", label: "Super Admin Console", icon: ShieldCheck, roles: ["super_admin"] },
    ],
  },
];

/** Settings items rendered inside the top-navbar Profile dropdown. */
export const PROFILE_SETTINGS_ITEMS: NavItem[] = [
  { href: "/settings/users-roles", label: "Users & Roles", icon: Users, permission: "users.manage" },
  { href: "/settings/claim-status-buckets", label: "Claim Status & Buckets", icon: Layers, permission: "templates.manage" },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/integrations", label: "Integrations", icon: Plug, permission: "practices.manage" },
  { href: "/settings/company-profile", label: "Company Profile", icon: Landmark, permission: "practices.manage" },
  { href: "/audit-logs", label: "Audit Logs", icon: ShieldCheck, permission: "audit.read" },
];

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  ...TOP_NAV_SECTIONS,
  {
    title: "Settings",
    items: PROFILE_SETTINGS_ITEMS,
  },
];

export const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/worklist", label: "Worklist", icon: ListChecks },
  { href: "/upload-claims", label: "Upload Claims", icon: Upload },
  { href: "/reporting", label: "Reporting", icon: ChartColumn },
  { href: "/ar-management", label: "AR Management", icon: UserCog, collapsible: true },
  { href: "/helpdesk", label: "HelpDesk", icon: LifeBuoy, collapsible: true },
  { href: "/knowledge-center", label: "Knowledge Center", icon: BookOpen, collapsible: true },
  { href: "/settings/practices", label: "Settings", icon: Settings, match: "/settings" },
];

export interface SettingsNavItem {
  slug: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const SETTINGS_NAV: SettingsNavItem[] = [
  { slug: "practices", label: "Practices", icon: Building2, description: "Create and manage practices and assign users to each practice." },
  { slug: "users-roles", label: "Users & Roles", icon: Users, description: "Invite teammates and control what each role can see and do." },
  { slug: "denial-codes", label: "Denial Codes", icon: Tag, description: "Manage the denial codes your team selects on worklist claims." },
  { slug: "claim-status-buckets", label: "Claim Status & Buckets", icon: Layers, description: "Configure claim statuses and aging buckets for your worklists." },
  { slug: "payers", label: "Payers", icon: ShieldCheck, description: "Maintain the payer directory, contact details and filing limits." },
  { slug: "upload-templates", label: "Worklist Settings", icon: Upload, description: "Set up each billing software's field mapping, worklist display columns, and template fields." },
  { slug: "notifications", label: "Notifications", icon: Bell, description: "Choose which alerts and digests your team receives." },
  { slug: "company-profile", label: "Company Profile", icon: Landmark, description: "Update your organization's name, address and billing details." },
  { slug: "integrations", label: "Integrations", icon: Plug, description: "Connect clearinghouses, PM systems and EHRs." },
];

export function isNavActive(item: NavItem, pathname: string, search = "") {
  const [baseHref, query] = item.href.split("?");
  if (query) {
    const currentSearch = search.startsWith("?") ? search.slice(1) : search;
    return pathname === baseHref && currentSearch === query;
  }
  if (item.match) {
    return pathname === item.match || pathname.startsWith(`${item.match}/`);
  }
  const currentSearch = search.startsWith("?") ? search.slice(1) : search;
  if ((baseHref === "/ar-management" || baseHref === "/reporting") && currentSearch) {
    return false;
  }
  return pathname === baseHref || pathname.startsWith(`${baseHref}/`);
}
