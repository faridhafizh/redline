import { Loader2 } from "lucide-react";
import type { SourceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const CONFIG: Record<
  SourceStatus,
  { label: string; dot: string; text: string }
> = {
  loading: { label: "memuat", dot: "bg-muted", text: "text-muted" },
  success: { label: "berhasil", dot: "bg-success", text: "text-success" },
  empty: { label: "tanpa data", dot: "bg-warn", text: "text-warn" },
  error: { label: "gagal", dot: "bg-danger", text: "text-danger" },
  unsupported: { label: "tidak didukung", dot: "bg-muted", text: "text-muted" },
};

export function SourceBadge({ status }: { status: SourceStatus }) {
  const config = CONFIG[status];
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium",
        config.text,
      )}
    >
      {status === "loading" ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      )}
      {config.label}
    </span>
  );
}
