import Link from "next/link";
import { Radar } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Radar size={18} />
          </span>
          <span className="text-sm font-semibold tracking-wide">
            REDLINE
          </span>
          <span className="hidden text-xs text-muted sm:inline">
            OSINT Research
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
