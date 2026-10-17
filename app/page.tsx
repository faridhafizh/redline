import Link from "next/link";
import { HistoryList } from "@/components/HistoryList";
import { RedlineLogo } from "@/components/RedlineLogo";
import { SearchBar } from "@/components/SearchBar";
import { SiteHeader } from "@/components/SiteHeader";
import { AGENTS } from "@/lib/agents";
import { SOURCES } from "@/lib/osint/registry";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="grid-noise relative flex-1">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-16 sm:py-24">
          <div className="mb-4 flex items-center gap-2">
            <RedlineLogo size={48} />
          </div>
          <span className="mb-4 rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-accent">
            OSINT Research · multi-sumber + AI
          </span>
          <h1 className="text-center text-4xl font-bold tracking-tight sm:text-6xl">
            REDLINE
          </h1>
          <p className="mt-4 max-w-xl text-center text-sm text-muted sm:text-base">
            Satu pencarian untuk domain, IP, email, dan kata kunci. Redline
            memanggil beberapa sumber intelijen publik secara paralel, lalu
            merangkumnya menjadi laporan yang mudah dipahami.
          </p>

          <div className="mt-8 w-full">
            <SearchBar size="lg" autoFocus />
          </div>

          <div className="mt-8 w-full">
            <HistoryList />
          </div>

          <section className="mt-14 w-full">
            <h2 className="mb-4 text-xs uppercase tracking-widest text-muted">
              {SOURCES.length} sumber terintegrasi · dijalankan paralel oleh{" "}
              {AGENTS.length} agent
            </h2>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {SOURCES.map((source) => (
                <div
                  key={source.id}
                  className="rounded-xl border border-border bg-surface p-3"
                >
                  <p className="text-sm font-medium">{source.label}</p>
                  <p className="mt-1 text-xs text-muted">{source.description}</p>
                  <p className="mt-2 font-mono text-[11px] uppercase text-accent">
                    {source.category} · {source.requiredEnv ? "api-key" : "no-key"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <p className="mt-12 max-w-xl text-center text-xs text-muted">
            Hasil bersifat indikatif dan hanya menggunakan sumber daya terbuka
            (public). Gunakan secara etis dan bertanggung jawab. ·{" "}
            <Link href="/" className="text-accent hover:underline">
              Redline
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
