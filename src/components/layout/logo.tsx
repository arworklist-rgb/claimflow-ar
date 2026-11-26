import Link from "next/link";

export function Logo() {
  return (
    <Link href="/upload-claims" className="flex shrink-0 items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-500 shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)]">
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
          <path
            d="M9.5 3h5a1 1 0 0 1 1 1v4.5H20a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-4.5V20a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-4.5H4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h4.5V4a1 1 0 0 1 1-1Z"
            fill="white"
          />
        </svg>
      </span>
      <span className="hidden leading-tight whitespace-nowrap min-[400px]:block">
        <span className="block text-[17px] font-bold tracking-tight text-white">ClaimFlow AR</span>
        <span className="hidden text-[11px] text-nav-foreground/70 sm:block">Claim Denial Workflow</span>
      </span>
    </Link>
  );
}
