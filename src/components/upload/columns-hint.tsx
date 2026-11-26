import { cn } from "@/lib/utils";

interface ColumnsHintProps {
  required: readonly string[];
  optional?: readonly string[];
  className?: string;
  title?: string;
}

/** "What does my file need?" at a glance, shown under a dropzone. */
export function ColumnsHint({ required, optional = [], className, title = "Columns your file needs" }: ColumnsHintProps) {
  return (
    <div className={cn("space-y-2 text-left", className)}>
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <ul className="flex flex-wrap gap-1.5" aria-label="Required columns">
        {required.map((c) => (
          <li key={c} className="rounded-md border bg-card px-2 py-0.5 text-xs font-medium text-foreground/90">
            {c}
          </li>
        ))}
        {optional.map((c) => (
          <li
            key={c}
            title="Optional"
            className="rounded-md border border-dashed bg-transparent px-2 py-0.5 text-xs text-muted-foreground"
          >
            {c} <span className="text-[10px] tracking-wide uppercase">optional</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
