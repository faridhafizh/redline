import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SearchBarFromParams } from "@/components/SearchBarFromParams";
import { SearchResults } from "@/components/SearchResults";
import { SiteHeader } from "@/components/SiteHeader";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ query: string }>;
}): Promise<Metadata> {
  const { query } = await params;
  return { title: `${decodeURIComponent(query)} — Redline` };
}

async function ResultsBody({
  params,
}: {
  params: Promise<{ query: string }>;
}) {
  const { query } = await params;
  const decoded = decodeURIComponent(query).trim();
  return <SearchResults key={decoded} query={decoded} />;
}

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-48 animate-pulse rounded bg-surface-2" />
      <div className="h-40 animate-pulse rounded-xl border border-border bg-surface" />
    </div>
  );
}

export default function SearchPage({
  params,
}: {
  params: Promise<{ query: string }>;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft size={13} /> Pencarian baru
        </Link>
        <div className="mb-6">
          <Suspense
            fallback={
              <div className="h-11 animate-pulse rounded-xl border border-border bg-surface" />
            }
          >
            <SearchBarFromParams />
          </Suspense>
        </div>
        <Suspense fallback={<ResultsSkeleton />}>
          <ResultsBody params={params} />
        </Suspense>
      </main>
    </div>
  );
}
