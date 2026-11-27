"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";

const ROLE_PREVIEWS = [
  {
    key: "super_admin",
    label: "Super Admin",
    headline: "Platform-wide multi-organization control",
    desc: "Monitor system health, provision organizations, oversee global users, and audit every tenant from one console.",
    highlights: ["Organizations Directory", "Global Audit Logs", "Platform Analytics", "System Health"],
  },
  {
    key: "org_admin",
    label: "Organization Admin",
    headline: "Complete RCM operations & governance",
    desc: "Manage practices, payers, 116+ CARC/RARC denial codes, custom upload templates, and team permissions.",
    highlights: ["Practices & Users", "Field & Template Mapping", "Payment Reconciliation", "Org Audit Trails"],
  },
  {
    key: "manager",
    label: "Manager",
    headline: "Team workload, SLA & escalation oversight",
    desc: "Balance AR 1 & AR 2 queues, track >60-day overdue claims, reassign workloads, and export scorecards.",
    highlights: ["Team Workload Grid", "AR Assignments", "Escalation Queue", "CSV Scorecards"],
  },
  {
    key: "ar_1",
    label: "AR Agent 1",
    headline: "Fast initial denial investigation & follow-up",
    desc: "Focus on New and 0–30 day claims, review CARC/RARC codes, update statuses inline, and log payer calls.",
    highlights: ["My Assigned Claims", "0–30 Day Aging", "Inline Worklist Edits", "HelpDesk Contacts"],
  },
  {
    key: "ar_2",
    label: "AR Agent 2",
    headline: "Complex appeals & high-age recovery",
    desc: "Resolve escalated and 60+ day aged claims, draft formal appeal letters, and track recovered revenue.",
    highlights: ["60+ Day Recovery", "Appeal Workflows", "Corrected Claims", "Recovery Tracking"],
  },
  {
    key: "viewer",
    label: "Viewer",
    headline: "Executive read-only financial visibility",
    desc: "Track outstanding AR, practice performance, and settled claims with safe read-only reporting.",
    highlights: ["Executive Summary", "Practice Breakdown", "Report Exports", "Knowledge Access"],
  },
];

const WORKFLOW_STEPS = [
  {
    num: "01",
    title: "Upload & Map Any Software",
    desc: "Choose your billing software or add a new one inline. Map Worklist fields and Template headers with dropdowns + custom aliases.",
    icon: Upload,
  },
  {
    num: "02",
    title: "Work Claims by Role & Aging",
    desc: "Claims auto-route into aging buckets (New, 30, 60, 60+). AR 1 and AR 2 specialists investigate denials, log notes, and escalate.",
    icon: Layers,
  },
  {
    num: "03",
    title: "Reconcile Payments & Close",
    desc: "Upload Paid Claims to auto-match on Patient Name + Service Date, recalculate balances, and auto-close settled claims.",
    icon: TrendingUp,
  },
];

export function LandingPage() {
  const [activeRole, setActiveRole] = useState(ROLE_PREVIEWS[0]);

  return (
    <div className="min-h-screen bg-[#F4EDE0] text-[#14213D]">
      {/* Fixed Glass Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#F4EDE0]/10 bg-[#14213D]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#FF6B5B] font-bold text-[#14213D] shadow-lg shadow-[#FF6B5B]/25">
              +
            </span>
            <span className="text-lg font-bold tracking-tight text-[#F4EDE0]">ClaimFlow AR</span>
          </Link>

          <nav
            aria-label="Landing"
            className="hidden items-center gap-1 rounded-full border border-[#F4EDE0]/15 bg-[#14213D]/55 px-2 py-1 backdrop-blur-md md:flex"
          >
            <a href="#features" className="rounded-full px-4 py-1.5 text-sm font-medium text-[#F4EDE0]/85 transition hover:bg-[#F4EDE0]/10 hover:text-[#F4EDE0]">
              Features
            </a>
            <a href="#roles" className="rounded-full px-4 py-1.5 text-sm font-medium text-[#F4EDE0]/85 transition hover:bg-[#F4EDE0]/10 hover:text-[#F4EDE0]">
              Roles
            </a>
            <a href="#workflow" className="rounded-full px-4 py-1.5 text-sm font-medium text-[#F4EDE0]/85 transition hover:bg-[#F4EDE0]/10 hover:text-[#F4EDE0]">
              Workflow
            </a>
            <Link href="/guide" className="rounded-full px-4 py-1.5 text-sm font-medium text-[#F4EDE0]/85 transition hover:bg-[#F4EDE0]/10 hover:text-[#F4EDE0]">
              Knowledge
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="rounded-full border border-[#F4EDE0]/20 bg-[#14213D]/50 px-4 py-2 text-sm font-medium text-[#F4EDE0] backdrop-blur-md transition hover:bg-[#F4EDE0]/10"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FF6B5B] px-4 py-2 text-sm font-semibold text-[#14213D] shadow-lg shadow-[#FF6B5B]/30 transition hover:bg-[#ff7f71]"
            >
              Open App <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION: Navy (#14213D) + Coral (#FF6B5B) atmospheric glow + fluted glass */}
      <section className="relative overflow-hidden bg-[#14213D] text-[#F4EDE0]">
        {/* Atmospheric Coral & Navy radial mesh */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 68% 54%, rgba(255, 107, 91, 0.72) 0%, rgba(255, 107, 91, 0.28) 28%, rgba(20, 33, 61, 0.92) 64%, #14213D 100%)",
          }}
        />
        {/* Fluted / ribbed glass vertical texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-45 mix-blend-overlay"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(244,237,224,0.16) 0px, rgba(244,237,224,0.02) 4px, rgba(10,16,32,0.35) 8px, rgba(244,237,224,0.06) 12px)",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-5 pt-24 pb-12 sm:px-8 lg:px-12">

          {/* Asymmetric Split Hero */}
          <div className="mt-14 grid items-end gap-10 lg:mt-20 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F4EDE0]/20 bg-[#14213D]/60 px-3.5 py-1 text-xs font-medium text-[#F4EDE0]/90 backdrop-blur-md">
                <Sparkles className="size-3.5 text-[#FF6B5B]" />
                Healthcare Revenue Cycle &amp; Denial Recovery
              </div>

              <h1 className="text-4xl leading-[1.05] font-bold tracking-tight text-[#F4EDE0] sm:text-6xl lg:text-[4.25rem]">
                Denials that resolve like clockwork.
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-[#F4EDE0]/80 sm:text-lg">
                Six role-tailored workspaces, smart Excel template mapping, and automated payment reconciliation—built for US medical billing teams.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B5B] px-6 py-3 text-sm font-semibold text-[#14213D] shadow-lg shadow-[#FF6B5B]/30 transition hover:bg-[#ff7f71]"
                >
                  Start Recovery <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#roles"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#F4EDE0]/25 bg-[#14213D]/40 px-5 py-3 text-sm font-medium text-[#F4EDE0] backdrop-blur-md transition hover:bg-[#F4EDE0]/10"
                >
                  Explore 6 Roles
                </a>
              </div>
            </div>

            {/* Right-Side Floating Glassmorphic Snapshot Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[#F4EDE0]/20 bg-[#14213D]/65 p-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-[#F4EDE0]/10 pb-3">
                  <div>
                    <p className="text-xs font-medium text-[#F4EDE0]/65">Live AR Snapshot</p>
                    <p className="text-sm font-semibold text-[#F4EDE0]">ClaimFlow Medical Group</p>
                  </div>
                  <span className="rounded-full bg-[#FF6B5B]/20 px-2.5 py-0.5 text-xs font-semibold text-[#FF6B5B]">
                    6 Active Roles
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl border border-[#F4EDE0]/10 bg-[#F4EDE0]/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#F4EDE0]">CLM-4082 · UnitedHealthcare</p>
                      <p className="text-xs text-[#F4EDE0]/65">30d Aging · CARC CO-16 · AR Agent 1</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#F4EDE0]">$4,280</p>
                      <span className="text-[11px] font-medium text-[#FF6B5B]">Resubmitted</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-[#F4EDE0]/10 bg-[#F4EDE0]/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-[#F4EDE0]">CLM-4109 · Medicare Part B</p>
                      <p className="text-xs text-[#F4EDE0]/65">60+ Aging · Auto-Matched ERA</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#F4EDE0]">$1,940</p>
                      <span className="text-[11px] font-medium text-emerald-300">Paid &amp; Closed</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-[#FF6B5B] px-4 py-2.5 text-xs font-semibold text-[#14213D]">
                  <span>94.2% Clean Reconciliation Rate</span>
                  <span>RLS Secured</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom 4-Column Hairline Trust Strip */}
          <div className="mt-14 grid gap-6 border-t border-[#F4EDE0]/15 pt-7 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 size-4 shrink-0 text-[#FF6B5B]" />
              <div>
                <p className="text-sm font-semibold text-[#F4EDE0]">6-Role RBAC</p>
                <p className="text-xs text-[#F4EDE0]/70">Super Admin to Viewer with scoped practice access.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="mt-0.5 size-4 shrink-0 text-[#FF6B5B]" />
              <div>
                <p className="text-sm font-semibold text-[#F4EDE0]">Dynamic Templates</p>
                <p className="text-xs text-[#F4EDE0]/70">Dropdown + custom header mapping for any PM software.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 size-4 shrink-0 text-[#FF6B5B]" />
              <div>
                <p className="text-sm font-semibold text-[#F4EDE0]">PostgreSQL RLS</p>
                <p className="text-xs text-[#F4EDE0]/70">Multi-organization isolation &amp; immutable audit logs.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen className="mt-0.5 size-4 shrink-0 text-[#FF6B5B]" />
              <div>
                <p className="text-sm font-semibold text-[#F4EDE0]">A-to-Z Knowledge Hub</p>
                <p className="text-xs text-[#F4EDE0]/70">Built-in troubleshooting guides &amp; Cloudinary docs.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROLE SHOWCASE (Cream #F4EDE0) */}
      <section id="roles" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs font-bold tracking-widest text-[#FF6B5B] uppercase">Unified Role Architecture</p>
          <h2 className="text-3xl font-bold tracking-tight text-[#14213D] sm:text-4xl">
            One platform. Six tailored workspaces.
          </h2>
          <p className="text-base text-[#14213D]/75">
            Every user signs into the exact dashboard, sidebar, and permission scope required for their RCM responsibilities.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {ROLE_PREVIEWS.map((role) => {
            const active = activeRole.key === role.key;
            return (
              <button
                key={role.key}
                type="button"
                onClick={() => setActiveRole(role)}
                className={
                  active
                    ? "rounded-full bg-[#14213D] px-4 py-2 text-sm font-semibold text-[#F4EDE0] shadow-sm transition"
                    : "rounded-full border border-[#14213D]/20 bg-white/60 px-4 py-2 text-sm font-medium text-[#14213D] transition hover:bg-white"
                }
              >
                {role.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 rounded-2xl border border-[#14213D]/12 bg-white/75 p-6 shadow-sm sm:p-8 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            <span className="inline-block rounded-full bg-[#FF6B5B]/15 px-3 py-1 text-xs font-semibold text-[#14213D]">
              {activeRole.label}
            </span>
            <h3 className="text-2xl font-bold text-[#14213D]">{activeRole.headline}</h3>
            <p className="text-sm leading-relaxed text-[#14213D]/75 sm:text-base">{activeRole.desc}</p>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:col-span-5">
            {activeRole.highlights.map((h) => (
              <div key={h} className="flex items-center gap-2.5 rounded-xl border border-[#14213D]/10 bg-[#F4EDE0]/60 px-3.5 py-2.5 text-sm font-medium text-[#14213D]">
                <CheckCircle2 className="size-4 shrink-0 text-[#FF6B5B]" />
                {h}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW SECTION (Navy #14213D Band) */}
      <section id="workflow" className="bg-[#14213D] py-20 text-[#F4EDE0]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-bold tracking-widest text-[#FF6B5B] uppercase">End-to-End RCM Flow</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From spreadsheet upload to settled revenue.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {WORKFLOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="rounded-2xl border border-[#F4EDE0]/12 bg-[#F4EDE0]/5 p-6">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[#FF6B5B]">{step.num}</span>
                    <Icon className="size-5 text-[#F4EDE0]/75" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#F4EDE0]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#F4EDE0]/75">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURES BENTO (Cream #F4EDE0) */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[#14213D]/12 bg-white/75 p-6">
            <ShieldCheck className="size-6 text-[#FF6B5B]" />
            <h3 className="mt-4 text-lg font-bold text-[#14213D]">116+ CARC / RARC Denial Codes</h3>
            <p className="mt-2 text-sm text-[#14213D]/75">
              Preloaded standard denial catalog with category grouping, bulk Excel/CSV import, and inline tagging on every claim.
            </p>
          </div>
          <div className="rounded-2xl border border-[#14213D]/12 bg-white/75 p-6">
            <FileSpreadsheet className="size-6 text-[#FF6B5B]" />
            <h3 className="mt-4 text-lg font-bold text-[#14213D]">Custom Worklist &amp; Excel Exports</h3>
            <p className="mt-2 text-sm text-[#14213D]/75">
              Pin Patient Name and Claim No, edit inline, add custom fields, and export worklists matching your exact column order.
            </p>
          </div>
          <div className="rounded-2xl border border-[#14213D]/12 bg-white/75 p-6">
            <BookOpen className="size-6 text-[#FF6B5B]" />
            <h3 className="mt-4 text-lg font-bold text-[#14213D]">HelpDesk &amp; Knowledge Center</h3>
            <p className="mt-2 text-sm text-[#14213D]/75">
              Instant payer contacts with one-click copy, A-to-Z troubleshooting guides, and Cloudinary-backed SOP storage.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FOOTER (Navy + Coral Glow) */}
      <footer className="relative overflow-hidden bg-[#14213D] py-16 text-[#F4EDE0]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background: "radial-gradient(circle at 80% 50%, rgba(255, 107, 91, 0.35), transparent 55%)",
          }}
        />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center sm:px-8 lg:px-12">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Ready to streamline your AR workflow?</h2>
            <p className="mt-1 text-sm text-[#F4EDE0]/75">Sign in with your organization credentials to access your role workspace.</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF6B5B] px-6 py-3 text-sm font-semibold text-[#14213D] shadow-lg shadow-[#FF6B5B]/30 transition hover:bg-[#ff7f71]"
          >
            Sign In to ClaimFlow AR <ArrowRight className="size-4" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
