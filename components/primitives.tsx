import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Chips({
  items,
  tone = "default",
}: {
  items: (string | number)[];
  tone?: "default" | "accent" | "danger" | "warn";
}) {
  if (items.length === 0) return null;
  const tones: Record<string, string> = {
    default: "border-border text-muted",
    accent: "border-accent/40 text-accent",
    danger: "border-danger/40 text-danger",
    warn: "border-warn/40 text-warn",
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={String(item)}
          className={cn(
            "rounded-md border px-2 py-0.5 font-mono text-xs",
            tones[tone],
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function DataRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <span className="shrink-0 text-xs uppercase tracking-wide text-muted">
        {label}
      </span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}

export function ExternalAnchor({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline"
    >
      {children}
      <ExternalLink size={11} />
    </a>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}
