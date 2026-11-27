"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ChevronUp, Search, Sparkles } from "lucide-react";
import { GUIDE_CATEGORIES, KNOWLEDGE_GUIDE_ARTICLES, type GuideCategory } from "@/lib/knowledge/guide-data";

export default function PublicGuidePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | GuideCategory>("All");
  const [expandedId, setExpandedId] = useState<string | null>("nav-sidebar");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return KNOWLEDGE_GUIDE_ARTICLES.filter((a) => {
      if (category !== "All" && a.category !== category) return false;
      if (!q) return true;
      return [a.title, a.summary, a.category, ...a.steps, a.tip ?? "", ...a.tags]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [query, category]);

  return (
    <div className="min-h-screen bg-[#F4EDE0] text-[#14213D]">
      {/* Fixed Landing Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#F4EDE0]/10 bg-[#14213D]/85 backdrop-blur-md">
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
            <Link href="/#features" className="rounded-full px-4 py-1.5 text-sm font-medium text-[#F4EDE0]/85 transition hover:bg-[#F4EDE0]/10 hover:text-[#F4EDE0]">
              Features
            </Link>
            <Link href="/#roles" className="rounded-full px-4 py-1.5 text-sm font-medium text-[#F4EDE0]/85 transition hover:bg-[#F4EDE0]/10 hover:text-[#F4EDE0]">
              Roles
            </Link>
            <Link href="/#workflow" className="rounded-full px-4 py-1.5 text-sm font-medium text-[#F4EDE0]/85 transition hover:bg-[#F4EDE0]/10 hover:text-[#F4EDE0]">
              Workflow
            </Link>
            <Link href="/guide" className="rounded-full bg-[#F4EDE0]/15 px-4 py-1.5 text-sm font-semibold text-[#F4EDE0]">
              Knowledge
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-full border border-[#F4EDE0]/20 bg-[#14213D]/50 px-4 py-2 text-sm font-medium text-[#F4EDE0] transition hover:bg-[#F4EDE0]/10 sm:inline-flex"
            >
              <ArrowLeft className="size-4" /> Home
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FF6B5B] px-4 py-2 text-sm font-semibold text-[#14213D] shadow-lg shadow-[#FF6B5B]/30 transition hover:bg-[#ff7f71]"
            >
              Sign In <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Navy Hero Banner */}
      <section className="relative overflow-hidden bg-[#14213D] pt-28 pb-14 text-[#F4EDE0]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: "radial-gradient(circle at 75% 40%, rgba(255, 107, 91, 0.45), transparent 55%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F4EDE0]/20 bg-[#14213D]/60 px-3.5 py-1 text-xs font-medium text-[#F4EDE0]/90">
            <Sparkles className="size-3.5 text-[#FF6B5B]" />
            Public Knowledge Center
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            ClaimFlow AR A-to-Z Guide
          </h1>
          <p className="mt-3 max-w-2xl text-base text-[#F4EDE0]/80">
            Explore role manuals, Excel upload &amp; mapping walkthroughs, reconciliation rules, and troubleshooting steps—no sign-in required.
          </p>

          <div className="relative mt-6 max-w-2xl">
            <Search className="absolute top-3.5 left-4 size-4 text-[#F4EDE0]/60" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides, errors, roles, or workflows..."
              className="w-full rounded-xl border border-[#F4EDE0]/20 bg-[#14213D]/70 py-3 pr-4 pl-11 text-sm text-[#F4EDE0] placeholder:text-[#F4EDE0]/50 focus:border-[#FF6B5B] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Cream Knowledge Articles */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
        <div className="flex flex-wrap gap-2">
          {(["All", ...GUIDE_CATEGORIES] as const).map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={
                  active
                    ? "rounded-full bg-[#14213D] px-4 py-1.5 text-xs font-semibold text-[#F4EDE0]"
                    : "rounded-full border border-[#14213D]/20 bg-white/70 px-4 py-1.5 text-xs font-medium text-[#14213D] hover:bg-white"
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#14213D]/12 bg-white/75 p-10 text-center">
            <BookOpen className="mx-auto mb-2 size-8 text-[#FF6B5B]" />
            <p className="font-semibold">No matching guides found</p>
            <p className="mt-1 text-sm text-[#14213D]/70">Try clearing your search or selecting another category.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {filtered.map((article) => {
              const isOpen = expandedId === article.id || Boolean(query.trim());
              return (
                <div
                  key={article.id}
                  className="rounded-2xl border border-[#14213D]/12 bg-white/80 p-5 shadow-sm transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block rounded-full bg-[#FF6B5B]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#14213D]">
                        {article.category}
                      </span>
                      <h2 className="mt-2 text-base font-bold text-[#14213D]">{article.title}</h2>
                      <p className="mt-1 text-sm text-[#14213D]/70">{article.summary}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={isOpen ? "Collapse" : "Expand"}
                      onClick={() => setExpandedId(isOpen ? null : article.id)}
                      className="rounded-lg p-1.5 text-[#14213D]/70 hover:bg-[#14213D]/5"
                    >
                      {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-4 space-y-3 border-t border-[#14213D]/10 pt-4">
                      <ol className="list-decimal space-y-1.5 pl-4 text-sm text-[#14213D]/90">
                        {article.steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                      {article.tip && (
                        <div className="rounded-xl bg-[#F4EDE0] px-3.5 py-2.5 text-xs text-[#14213D]/80">
                          <strong className="text-[#14213D]">Tip:</strong> {article.tip}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
