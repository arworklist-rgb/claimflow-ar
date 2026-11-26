import type { RoleKey } from "@/server/auth/rbac";

export type GuideCategory =
  | "Getting Started & Navigation"
  | "Roles & Permissions"
  | "Claims & Uploads"
  | "Worklist & AR Management"
  | "Templates & Mapping"
  | "Settings & Admin"
  | "Troubleshooting & FAQ";

export const GUIDE_CATEGORIES: GuideCategory[] = [
  "Getting Started & Navigation",
  "Roles & Permissions",
  "Claims & Uploads",
  "Worklist & AR Management",
  "Templates & Mapping",
  "Settings & Admin",
  "Troubleshooting & FAQ",
];

export interface GuideArticle {
  id: string;
  category: GuideCategory;
  title: string;
  summary: string;
  steps: string[];
  tip?: string;
  route?: string;
  routeLabel?: string;
  permission?: string;
  roles?: RoleKey[];
  tags: string[];
}

export const KNOWLEDGE_GUIDE_ARTICLES: GuideArticle[] = [
  // 1. GETTING STARTED & NAVIGATION
  {
    id: "nav-sidebar",
    category: "Getting Started & Navigation",
    title: "How to Navigate Using the Role Sidebar & Slider",
    summary: "All modules live in the collapsible left sidebar, dynamically filtered to your role's permissions.",
    steps: [
      "Look at the top badge of the left sidebar to confirm your active role (e.g., Super Admin, Organization Admin, Manager, AR Agent 1, AR Agent 2, or Viewer).",
      "Click the collapse/expand icon next to the role badge to slide the sidebar between full width and compact icon mode.",
      "On mobile or narrow screens, tap the hamburger menu icon in the top-left header to open the slide-out navigation drawer.",
      "Sidebar sections include OVERVIEW, CLAIMS OPERATIONS, TEAM MANAGEMENT, DIRECTORIES, RESOURCES, ANALYTICS, ADMINISTRATION, and PLATFORM (Super Admin only).",
    ],
    tip: "If a menu item is missing, your current role does not have permission for that module. Ask an Organization Admin to review your role.",
    route: "/dashboard",
    routeLabel: "Go to Dashboard",
    tags: ["navigation", "sidebar", "slider", "menu", "mobile", "collapse"],
  },
  {
    id: "nav-topbar",
    category: "Getting Started & Navigation",
    title: "Top Utility Bar: Practice Filter, Dark Mode, Notifications & Account",
    summary: "Control global practice scope, theme, live alerts, and sign out from the top bar.",
    steps: [
      "Practice Dropdown (All Practices): Filters Dashboard, Worklist, AR Management, and Reporting to a single practice or all practices.",
      "Moon / Sun Icon: Toggles between Light Mode and Dark Mode.",
      "Bell Icon: Displays live unread notifications for your account. Click an item to mark it read, or click 'View all' to manage preferences.",
      "Avatar Menu (top right): Shows your signed-in name, role, email, Notification Settings link, and Sign out button.",
    ],
    route: "/settings/notifications",
    routeLabel: "Notification Settings",
    tags: ["topbar", "practice", "dark mode", "notifications", "bell", "sign out", "logout"],
  },
  {
    id: "auth-login",
    category: "Getting Started & Navigation",
    title: "Signing In, Password Reset & Switching Accounts",
    summary: "How authentication works and how to switch between role accounts cleanly.",
    steps: [
      "Open /login and enter your work email and password, then click Sign In.",
      "You will be redirected automatically to /dashboard, which renders the dashboard built specifically for your role.",
      "To reset a forgotten password, enter your email on /login and click 'Forgot password?' to receive a reset link.",
      "To test or switch to another user account, click the top-right Avatar Menu -> Sign out, or open an Incognito browser window.",
    ],
    route: "/login",
    routeLabel: "Open Login Page",
    tags: ["login", "password", "forgot password", "sign in", "switch account", "session"],
  },

  // 2. ROLES & PERMISSIONS
  {
    id: "roles-overview",
    category: "Roles & Permissions",
    title: "Complete 6-Role Access Matrix (Who Can Do What)",
    summary: "Understand the exact boundaries of Super Admin, Organization Admin, Manager, AR 1, AR 2, and Viewer.",
    steps: [
      "Super Admin: Platform-wide access across all organizations (/platform), global analytics, system health, and global audit logs.",
      "Organization Admin: Full control over their organization—practices, users & roles, templates, payers, denial codes, uploads, worklist, reconciliation, and org audit logs.",
      "Manager / Supervisor: Supervises team workload, assigns/reassigns AR 1 & AR 2, monitors >60d overdue claims, runs reports, and reviews audit logs.",
      "AR Agent 1 (AR 1): Works assigned initial claims (New & 0–30 day aging), edits claim actions/denial codes, uploads claims, and uses HelpDesk/Knowledge Center.",
      "AR Agent 2 (AR 2): Handles escalated and >60 day aged claims, manages appeals/recovery, and views Reporting.",
      "Viewer: Read-only access to dashboards, worklist, reports, and Knowledge Center documents. Cannot edit, upload, or delete.",
    ],
    tip: "Permissions are enforced on both the UI and backend PostgreSQL Row Level Security (RLS).",
    route: "/settings/users-roles",
    routeLabel: "View Users & Roles",
    permission: "users.manage",
    tags: ["roles", "rbac", "permissions", "super admin", "org admin", "manager", "ar1", "ar2", "viewer"],
  },
  {
    id: "roles-practice-scope",
    category: "Roles & Permissions",
    title: "Organization & Practice-Level Data Isolation",
    summary: "How multi-organization isolation and practice assignments restrict claim visibility.",
    steps: [
      "Every user belongs to a single organization (except Super Admin who oversees all organizations).",
      "AR 1 and AR 2 specialists can only view and edit claims belonging to practices assigned to them in user_practices.",
      "Organization Admins and Managers can access all practices within their organization.",
      "Attempting to access another organization's or unassigned practice's claim via URL or API is blocked automatically.",
    ],
    route: "/settings/practices",
    routeLabel: "Manage Practices",
    permission: "practices.manage",
    tags: ["isolation", "practice", "organization", "rls", "security", "403"],
  },

  // 3. CLAIMS & UPLOADS
  {
    id: "upload-new-claims",
    category: "Claims & Uploads",
    title: "How to Upload New Claims (Excel / CSV) & Auto-Assign AR 1 / AR 2",
    summary: "Step-by-step guide to importing new worklist spreadsheets and understanding duplicate claim updates.",
    steps: [
      "Go to Upload Claims (/upload-claims) and select the Billing Software from the dropdown (or click '+' to add a new software template).",
      "Select the Practice Name for the batch.",
      "Drag and drop your .xlsx/.xls/.csv file, or click 'Download template' for a green-header template, or click 'Try with a sample file'.",
      "Review the live preview table and check for any missing required columns before clicking 'Upload New Claims'.",
      "Assignment rule: New Claim Nos assign the uploader as AR 1. Re-uploading an existing Claim No (same practice) updates the claim and sets the new uploader as AR 2 if different from AR 1.",
    ],
    route: "/upload-claims",
    routeLabel: "Go to Upload Claims",
    permission: "claims.import",
    tags: ["upload", "excel", "csv", "new claims", "ar1", "ar2", "duplicate", "sample"],
  },
  {
    id: "upload-paid-claims",
    category: "Claims & Uploads",
    title: "How to Upload Paid Claims & Automatic Payment Matching",
    summary: "Post payer remittances and automatically close settled claims.",
    steps: [
      "On Upload Claims (/upload-claims), use the Paid Claims card on the right.",
      "Download the Paid Claim template: Patient Acct No | Patient Name | Service date | Payment Date | Transaction By | Paid Amount.",
      "Upload your file. Each row matches against the worklist using normalized Patient Name + Service Date.",
      "Single match: Posts the payment, recalculates balance, and auto-closes the claim as 'Paid and closed' if fully paid (or marks partial).",
      "Unmatched or Multiple Match rows are logged in Payment Reconciliation (/reconciliation) for manual review.",
    ],
    route: "/reconciliation",
    routeLabel: "Open Reconciliation",
    permission: "claims.write",
    tags: ["paid claims", "payment", "matching", "reconciliation", "auto-close", "partial"],
  },

  // 4. WORKLIST & AR MANAGEMENT
  {
    id: "worklist-guide",
    category: "Worklist & AR Management",
    title: "Working Claims in the Worklist (Filters, Inline Edits, Add Claim & Export)",
    summary: "Everything you can do in the central Worklist grid.",
    steps: [
      "Filter by Aging Bucket tabs (All, New 0–20d, 30 Days, 60 Days, 60+ Days), Responsible, Action, Submitted Status, Assignee, or Denial Code.",
      "Patient Name and Claim No stay pinned on the left, while the Edit (pencil) icon stays pinned on the right while scrolling.",
      "Edit directly inline in the table: Action, Submission Status (First/Second/Third), Denial Codes, Paid Amount, and Transaction By.",
      "Click '+ Add claim' in the toolbar to manually add a single claim with dropdowns.",
      "Click the pencil icon on any row to open the full Claim Edit popup, add follow-up comments, view history, or reassign AR 1 / AR 2 (admin).",
      "Click 'Export worklist' to download an Excel workbook matching your configured Worklist Columns.",
    ],
    route: "/worklist",
    routeLabel: "Open Worklist",
    permission: "claims.read",
    tags: ["worklist", "inline edit", "add claim", "export", "aging", "filters", "denial codes"],
  },
  {
    id: "ar-management-guide",
    category: "Worklist & AR Management",
    title: "Using AR Management: Assignments, Follow-up Tasks & Escalations",
    summary: "Manage specialist queues, scheduled follow-ups, and >60 day escalations.",
    steps: [
      "AR Assignments tab: View open claims sorted oldest-first, filter by specialist, reassign AR 1, or click 'Escalate' to assign AR 2.",
      "Follow-up Tasks tab: Track open claims awaiting payer follow-up or status verification.",
      "Escalations tab: Review all escalated claims and claims aged >60 days requiring AR 2 appeals or manager review.",
    ],
    route: "/ar-management",
    routeLabel: "Open AR Management",
    permission: "claims.write",
    tags: ["ar management", "assignments", "follow-up", "escalations", "overdue", "reassign"],
  },
  {
    id: "reporting-guide",
    category: "Worklist & AR Management",
    title: "Generating Scorecards & Exporting Reports",
    summary: "Analyze recovery rates, billed/paid totals, and team productivity.",
    steps: [
      "Open Reporting (/reporting) or click 'Team Performance' in the sidebar.",
      "Use the top-bar Practice selector to scope to one practice or All Practices.",
      "Switch grouping between Practice, Claim Action, or AR 1 Specialist.",
      "Click 'Export CSV' to download the scorecard for executive review.",
    ],
    route: "/reporting",
    routeLabel: "Open Reporting",
    permission: "reports.view",
    tags: ["reporting", "analytics", "csv", "export", "scorecard", "team performance"],
  },

  // 5. TEMPLATES & MAPPING
  {
    id: "templates-mapping-guide",
    category: "Templates & Mapping",
    title: "Field Mapping & Template Mapping (Dropdown + Add Custom Concept)",
    summary: "How to configure billing software templates using both Dropdown selection and '+ Add' options.",
    steps: [
      "Open Settings -> Upload Templates (/settings/upload-templates) -> Field Mapping tab.",
      "Choose a Billing Software from the dropdown or click '+ Add' to create a new software template.",
      "Worklist fields column: Pick a target field from the dropdown, OR select '+ Add new field...' at the very top to create a new custom field immediately.",
      "Template Fields column: Pick a standard Excel header from the dropdown, OR select '+ Add custom header...' at the very top to add a custom column header.",
      "Also accepts column: Enter comma-separated alternative column names (e.g., 'Claim Number, Claim ID') so slight variations in client files still import cleanly.",
      "Use the up/down arrows to match the Excel column order, toggle visibility, and click Save.",
    ],
    route: "/settings/upload-templates",
    routeLabel: "Open Upload Templates",
    permission: "templates.manage",
    tags: ["templates", "mapping", "field mapping", "dropdown", "add custom header", "add new field", "aliases"],
  },
  {
    id: "templates-worklist-cols",
    category: "Templates & Mapping",
    title: "Customizing Worklist Columns & Template Fields",
    summary: "Control which columns appear on the Worklist and in Excel exports.",
    steps: [
      "In Upload Templates -> Worklist columns tab, use the dropdowns to choose both the Column name (+ Add custom header...) and Shows field (+ Add new field...).",
      "Reorder or remove data columns between Claim No and Denial Code (up to 20 columns).",
      "In Template fields tab, manage all custom fields (Text, Date, Days, Currency) shared across templates and exports.",
    ],
    route: "/settings/upload-templates",
    routeLabel: "Customize Columns",
    permission: "templates.manage",
    tags: ["worklist columns", "custom fields", "export columns", "customize"],
  },

  // 6. SETTINGS & ADMIN
  {
    id: "settings-practices-users",
    category: "Settings & Admin",
    title: "Managing Practices, Users, Roles & Payer Directories",
    summary: "Configure practices, invite teammates, maintain payers, and manage 116+ CARC/RARC denial codes.",
    steps: [
      "Practices (/settings/practices): Add/edit/deactivate practices and assign team members to each practice.",
      "Users & Roles (/settings/users-roles): Invite employees by email, assign one of the 6 RBAC roles, and review permission scopes.",
      "Payers (/settings/payers): Maintain payer codes, EDI Payer IDs, timely filing limits, and appeal deadlines.",
      "Denial Codes (/settings/denial-codes): Search, add, deactivate, or bulk-import CARC/RARC codes from Excel/CSV.",
      "Claim Status & Buckets (/settings/claim-status-buckets): Configure workflow statuses and aging thresholds.",
    ],
    route: "/settings/practices",
    routeLabel: "Open Practices",
    permission: "practices.manage",
    tags: ["practices", "users", "payers", "denial codes", "carc", "rarc", "buckets"],
  },
  {
    id: "settings-helpdesk-audit",
    category: "Settings & Admin",
    title: "Using HelpDesk, Company Profile, Integrations & Audit Logs",
    summary: "Find payer contacts fast, configure org settings, and review immutable HIPAA audit trails.",
    steps: [
      "HelpDesk (/helpdesk): Search payers, clearinghouses, practices, or teammates; click phone numbers to copy or open payer portals.",
      "Company Profile (/settings/company-profile): Update organization legal name, Tax ID (EIN), Group NPI, billing address, and document retention days.",
      "Integrations (/settings/integrations): Monitor Clearinghouse (EDI 837/835/277), EHR/PM, Cloudinary, and Email provider connection readiness.",
      "Audit Logs (/audit-logs): View timestamped records of claim edits, imports, document downloads, and role changes.",
    ],
    route: "/helpdesk",
    routeLabel: "Open HelpDesk",
    permission: "claims.read",
    tags: ["helpdesk", "contacts", "company profile", "integrations", "edi", "audit logs", "hipaa"],
  },

  // 7. TROUBLESHOOTING & COMMON ISSUES
  {
    id: "issue-missing-columns",
    category: "Troubleshooting & FAQ",
    title: "Issue: Excel Upload Fails with 'Missing Required Columns'",
    summary: "How to resolve column header mismatches when uploading billing software exports.",
    steps: [
      "Check which Billing Software is selected on /upload-claims—each software expects its own column names.",
      "Open Settings -> Upload Templates -> Field Mapping for that software.",
      "Either rename the 'Template Fields' dropdown to match your Excel file's exact header, OR add your file's header name to the 'Also accepts' column (comma-separated).",
      "Save the template, return to /upload-claims, re-select the file, and upload again.",
    ],
    route: "/settings/upload-templates",
    routeLabel: "Fix Column Mapping",
    permission: "templates.manage",
    tags: ["error", "missing columns", "upload failed", "excel", "aliases", "troubleshooting"],
  },
  {
    id: "issue-empty-worklist",
    category: "Troubleshooting & FAQ",
    title: "Issue: Worklist Appears Empty or Claims Are Missing",
    summary: "Why claims may be hidden by active filters or practice selection.",
    steps: [
      "Check the Practice dropdown in the top bar—if a specific practice is selected, switch it back to 'All Practices'.",
      "Check the Aging Bucket tabs (New, 30 Days, 60 Days, 60+) and reset to 'All'.",
      "Uncheck 'Hide Paid and closed' if you are looking for recently settled claims.",
      "Clear the search box and reset Responsible, Action, Submitted Status, Assignee, and Denial Code filters.",
      "If you are AR 1 or AR 2, confirm your user account is assigned to the claim's practice in user_practices.",
    ],
    route: "/worklist",
    routeLabel: "Check Worklist Filters",
    permission: "claims.read",
    tags: ["empty", "missing claims", "filter", "hide closed", "practice filter", "troubleshooting"],
  },
  {
    id: "issue-paid-no-match",
    category: "Troubleshooting & FAQ",
    title: "Issue: Paid Claims File Uploaded, But Claims Didn't Close",
    summary: "Diagnosing unmatched, multiple-match, and partial payment outcomes.",
    steps: [
      "Paid Claims match on Patient Name + Service Date. Verify the patient name spelling and DOS match the worklist claim.",
      "If Paid Amount is less than Billed Amount, the claim remains open as a partial payment with an updated remaining balance.",
      "If two claims exist for the same patient on the same Service Date, it is flagged as Multiple Match and requires manual reconciliation in /reconciliation.",
    ],
    route: "/reconciliation",
    routeLabel: "Review Reconciliation",
    permission: "claims.write",
    tags: ["paid", "unmatched", "partial payment", "multiple match", "not closing", "reconciliation"],
  },
  {
    id: "issue-permission-403",
    category: "Troubleshooting & FAQ",
    title: "Issue: '403 Forbidden', Hidden Buttons, or Wrong Role Dashboard",
    summary: "How to verify and fix role permissions or stale sessions.",
    steps: [
      "Check the role badge at the top of the left sidebar (and your name in the top-right Avatar Menu).",
      "If you see 'Viewer' or the wrong role, ask your Organization Admin to verify your role_id in user_profiles (or /settings/users-roles).",
      "If your role was just updated in the database, click Avatar Menu -> Sign out and sign back in at /login to refresh your session.",
      "Remember: Viewers cannot edit claims or upload files; Managers cannot manage users/practices; Organization Admins cannot access /platform (Super Admin only).",
    ],
    route: "/dashboard",
    routeLabel: "Check My Dashboard",
    tags: ["403", "forbidden", "permission", "missing button", "wrong role", "access denied"],
  },
  {
    id: "issue-slow-nav-login",
    category: "Troubleshooting & FAQ",
    title: "Issue: Slow Navigation in Dev Mode or Login Not Redirecting",
    summary: "Understanding dev-mode compilation vs. production speed and clearing stale cookies.",
    steps: [
      "In local development (next dev), the very first click on an unvisited route compiles that page once; subsequent clicks on the same route load immediately.",
      "If login shows 'Signed in successfully' but stays on /login, refresh the page or check browser cookies for localhost:3000.",
      "If a user signs in but falls back to demo mode, confirm their Auth UID exists in public.user_profiles with status = 'Active'.",
    ],
    tags: ["slow", "navigation", "dev mode", "redirect", "login", "cookies", "performance"],
  },
  {
    id: "issue-doc-upload",
    category: "Troubleshooting & FAQ",
    title: "Issue: Document Upload, Preview, or Download Fails in Knowledge Center",
    summary: "Supported file formats, 10 MB size limit, and Cloudinary authenticated storage checks.",
    steps: [
      "Confirm the file is Word (.doc, .docx), Excel/CSV (.xls, .xlsx, .csv), or PDF (.pdf) and under 10 MB.",
      "Only Admins/Managers or the original uploader can edit or delete a document.",
      "In production, downloads use short-lived (5-minute) signed Cloudinary URLs—if a download link expires, click Download again to generate a fresh signed URL.",
    ],
    tags: ["document", "upload", "download", "preview", "10mb", "cloudinary", "pdf", "docx"],
  },
];
