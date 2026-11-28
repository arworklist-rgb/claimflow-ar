import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface UploadCardProps {
  tone: "blue" | "green";
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/** Shared shell for the New / Paid claim submission cards: tinted header strip, body, footer actions. */
export function UploadCard({ tone, icon, title, description, children, footer }: UploadCardProps) {
  return (
    <Card className="h-full gap-0 py-0 shadow-[0_1px_2px_rgba(15,31,61,0.04),0_8px_24px_rgba(15,31,61,0.05)]">
      <div
        className={cn(
          "flex min-h-[88px] items-center gap-4 border-b px-5 py-4 sm:px-6 sm:py-5",
          tone === "green"
            ? "bg-gradient-to-r from-success-soft to-card"
            : "bg-gradient-to-r from-brand-soft to-card",
        )}
      >
        <div
          className={cn(
            "grid size-14 shrink-0 place-items-center rounded-2xl bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10",
            tone === "green" ? "text-success" : "text-brand-soft-foreground",
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col space-y-6 p-5 sm:p-6">{children}</div>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t bg-muted/30 px-5 py-4 sm:px-6">{footer}</div>
    </Card>
  );
}
