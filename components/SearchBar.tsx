"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { QUERY_TYPE_LABELS, detectQueryType } from "@/lib/classify";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  initialQuery?: string;
  autoFocus?: boolean;
  size?: "lg" | "md";
}

export function SearchBar({
  initialQuery = "",
  autoFocus = false,
  size = "md",
}: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [pending, setPending] = useState(false);

  const trimmed = value.trim();
  const type = trimmed ? detectQueryType(trimmed) : null;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!trimmed || pending) return;
    setPending(true);
    router.push(`/search/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-border bg-surface px-3 shadow-sm transition-colors focus-within:border-accent",
          size === "lg" ? "h-14" : "h-11",
        )}
      >
        <Search size={size === "lg" ? 20 : 16} className="shrink-0 text-muted" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoFocus={autoFocus}
          spellCheck={false}
          placeholder="domain, IP, email, atau kata kunci…"
          aria-label="Query OSINT"
          className={cn(
            "min-w-0 flex-1 bg-transparent font-mono outline-none placeholder:text-muted",
            size === "lg" ? "text-base" : "text-sm",
          )}
        />
        {type && (
          <span className="hidden shrink-0 rounded-md bg-accent-soft px-2 py-0.5 text-xs text-accent sm:inline">
            {QUERY_TYPE_LABELS[type]}
          </span>
        )}
        <button
          type="submit"
          disabled={!trimmed || pending}
          className={cn(
            "shrink-0 rounded-lg bg-accent font-medium text-background transition-opacity disabled:opacity-40",
            size === "lg" ? "px-5 py-2.5 text-sm" : "px-3 py-1.5 text-xs",
          )}
        >
          {pending ? "…" : "Telusuri"}
        </button>
      </div>
    </form>
  );
}
