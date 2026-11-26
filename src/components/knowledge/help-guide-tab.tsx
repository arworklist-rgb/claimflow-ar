"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, ChevronDown, ChevronUp, LifeBuoy, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/use-auth";
import {
  GUIDE_CATEGORIES,
  KNOWLEDGE_GUIDE_ARTICLES,
  type GuideArticle,
  type GuideCategory,
} from "@/lib/knowledge/guide-data";
import { cn } from "@/lib/utils";

const QUICK_ISSUES = [
  { label: "Excel missing columns", query: "missing columns" },
  { label: "Worklist looks empty", query: "empty" },
  { label: "Paid claims not closing", query: "paid" },
  { label: "Missing menu / 403 error", query: "403" },
  { label: "How to map fields", query: "mapping" },
  { label: "Role permissions", query: "roles" },
];

export function HelpGuideTab() {
  const { roleKey, roleLabel, can } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | GuideCategory>("All");
  const [expandedId, setExpandedId] = useState<string | null>("nav-sidebar");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return KNOWLEDGE_GUIDE_ARTICLES.filter((a) => {
      if (selectedCategory !== "All" && a.category !== selectedCategory) return false;
      if (!q) return true;
      const haystack = [a.title, a.summary, a.category, ...a.steps, a.tip ?? "", ...a.tags]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, selectedCategory]);

  const canAccessRoute = (article: GuideArticle) => {
    if (!article.route) return false;
    if (article.roles && !article.roles.includes(roleKey)) return false;
    if (article.permission && !can(article.permission)) return false;
    return true;
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <LifeBuoy className="text-primary size-5" aria-hidden />
              ClaimFlow AR — A-to-Z Self-Service Help &amp; Troubleshooting
            </CardTitle>
            <Badge variant="secondary">Viewing as {roleLabel}</Badge>
          </div>
          <CardDescription>
            Search any feature, navigation path, role permission, Excel upload rule, or troubleshooting scenario.
          </CardDescription>
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search anything (e.g. 'missing columns', 'AR 2', 'reconciliation', 'add custom header', '403')..."
              className="bg-card pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-muted-foreground mr-1 inline-flex items-center gap-1 text-xs font-medium">
              <Sparkles className="size-3.5" aria-hidden /> Common issues:
            </span>
            {QUICK_ISSUES.map((qi) => (
              <Button
                key={qi.label}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setSelectedCategory("All");
                  setQuery(qi.query);
                }}
              >
                {qi.label}
              </Button>
            ))}
            {(query || selectedCategory !== "All") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setQuery("");
                  setSelectedCategory("All");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(["All", ...GUIDE_CATEGORIES] as const).map((cat) => {
          const count =
            cat === "All"
              ? KNOWLEDGE_GUIDE_ARTICLES.length
              : KNOWLEDGE_GUIDE_ARTICLES.filter((a) => a.category === cat).length;
          const active = selectedCategory === cat;
          return (
            <Button
              key={cat}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              className="h-8"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat} ({count})
            </Button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpenCheck className="text-muted-foreground mx-auto mb-2 size-8" aria-hidden />
          <p className="font-semibold">No matching guides found</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Try another keyword or clear your search filter.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((article) => {
            const isOpen = expandedId === article.id || Boolean(query.trim());
            const showLink = canAccessRoute(article);
            return (
              <Card key={article.id} className={cn("flex flex-col justify-between transition-shadow", isOpen && "ring-primary/25 ring-1")}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[11px]">
                        {article.category}
                      </Badge>
                      <CardTitle className="text-base leading-snug">{article.title}</CardTitle>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={isOpen ? "Collapse guide" : "Expand guide"}
                      onClick={() => setExpandedId(isOpen ? null : article.id)}
                    >
                      {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </Button>
                  </div>
                  <CardDescription>{article.summary}</CardDescription>
                </CardHeader>

                {isOpen && (
                  <CardContent className="space-y-3 pt-0">
                    <ol className="text-foreground/90 list-decimal space-y-1.5 pl-4 text-sm">
                      {article.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                    {article.tip && (
                      <div className="bg-muted/60 rounded-lg border px-3 py-2 text-xs text-muted-foreground">
                        <strong className="text-foreground">Tip:</strong> {article.tip}
                      </div>
                    )}
                    {showLink && article.route && (
                      <div className="pt-1">
                        <Button asChild size="sm" variant="secondary">
                          <Link href={article.route}>
                            {article.routeLabel ?? "Open Screen"} <ArrowRight className="size-3.5" aria-hidden />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
