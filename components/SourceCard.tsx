import { getAgent } from "@/lib/agents";
import type { SourceResult } from "@/lib/types";
import { Chips, DataRow, EmptyNote, ExternalAnchor, Panel } from "./primitives";
import { SourceBadge } from "./SourceBadge";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}
function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
function num(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}
function arrStr(value: unknown): string[] {
  return asArray(value).filter((item): item is string => typeof item === "string");
}
function bool(value: unknown): boolean {
  return value === true;
}
function formatCompactDate(value: unknown): string {
  const s = str(value);
  if (!s) return "-";
  if (/^\d{8,14}$/.test(s)) {
    const date = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    return s.length >= 12 ? `${date} ${s.slice(8, 10)}:${s.slice(10, 12)}` : date;
  }
  return s.slice(0, 10);
}
function shortUrl(value: string): string {
  const clean = value.replace(/^https?:\/\//i, "");
  return clean.length > 52 ? `${clean.slice(0, 52)}…` : clean;
}
function RecordGroup({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone?: "default" | "accent" | "danger" | "warn";
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">{label}</p>
      <Chips items={items.slice(0, 30)} tone={tone} />
    </div>
  );
}
function StoryList({
  items,
}: {
  items: { title: string; url: string | null; meta: string }[];
}) {
  return (
    <div className="space-y-1.5">
      {items.map((item, index) => (
        <div key={index} className="border-b border-border/60 pb-1.5 last:border-0">
          <p className="text-sm">
            {item.url ? (
              <ExternalAnchor href={item.url}>{item.title}</ExternalAnchor>
            ) : (
              item.title
            )}
          </p>
          {item.meta && (
            <p className="mt-0.5 font-mono text-xs text-muted">{item.meta}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function renderContent(result: SourceResult): React.ReactNode {
  const data = asRecord(result.data);

  switch (result.source) {
    case "shodan-internetdb": {
      const ports = asArray(data.ports).map(Number).filter((n) => !Number.isNaN(n));
      const hostnames = arrStr(data.hostnames);
      const vulns = arrStr(data.vulns);
      const tags = arrStr(data.tags);
      return (
        <div className="space-y-3">
          <DataRow label="IP" value={<span className="font-mono">{str(data.ip) ?? "-"}</span>} />
          <div>
            <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Port terbuka</p>
            {ports.length ? <Chips items={ports} tone="accent" /> : <EmptyNote>Tidak ada port terbuka terdeteksi.</EmptyNote>}
          </div>
          {hostnames.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Hostname</p>
              <Chips items={hostnames} />
            </div>
          )}
          {vulns.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Kerentanan (CVE)</p>
              <Chips items={vulns} tone="danger" />
            </div>
          )}
          {tags.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Tag</p>
              <Chips items={tags} tone="warn" />
            </div>
          )}
        </div>
      );
    }

    case "rdap": {
      const events = asArray(data.events).map(asRecord);
      const nameservers = arrStr(data.nameservers);
      const status = arrStr(data.status);
      const entities = arrStr(data.entities);
      return (
        <div className="space-y-3">
          <DataRow label="Nama" value={<span className="font-mono">{str(data.name) ?? "-"}</span>} />
          {status.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Status</p>
              <Chips items={status} tone="warn" />
            </div>
          )}
          {events.length > 0 && (
            <div className="space-y-1">
              {events.map((event, index) => (
                <DataRow
                  key={index}
                  label={str(event.action) ?? "-"}
                  value={<span className="font-mono text-xs">{str(event.date)?.slice(0, 10) ?? "-"}</span>}
                />
              ))}
            </div>
          )}
          {nameservers.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Nameserver</p>
              <Chips items={nameservers} />
            </div>
          )}
          {entities.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Entitas</p>
              <Chips items={entities} />
            </div>
          )}
        </div>
      );
    }

    case "crtsh": {
      const subdomains = arrStr(data.subdomains);
      const total = num(data.subdomainCount) ?? subdomains.length;
      return (
        <div className="space-y-3">
          <div className="flex gap-4">
            <DataRow label="Sertifikat" value={<span className="font-mono">{num(data.totalCertificates) ?? 0}</span>} />
            <DataRow label="Subdomain" value={<span className="font-mono">{total}</span>} />
          </div>
          {subdomains.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">
                Subdomain {data.truncated ? "(dipotong)" : ""}
              </p>
              <Chips items={subdomains.slice(0, 60)} tone="accent" />
            </div>
          ) : (
            <EmptyNote>Tidak ada subdomain ditemukan.</EmptyNote>
          )}
        </div>
      );
    }

    case "xposedornot": {
      const breaches = asArray(data.breaches).map(asRecord);
      const names = arrStr(data.breachNames);
      const count = num(data.breachCount) ?? names.length;
      return (
        <div className="space-y-3">
          <DataRow
            label="Total kebocoran"
            value={<span className={count > 0 ? "font-mono text-danger" : "font-mono"}>{count}</span>}
          />
          {count > 0 ? (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Kebocoran terdeteksi</p>
              <Chips items={names.slice(0, 40)} tone="danger" />
            </div>
          ) : (
            <EmptyNote>Tidak ditemukan kebocoran untuk email ini.</EmptyNote>
          )}
          {breaches.length > 0 && (
            <div className="space-y-1.5">
              {breaches.slice(0, 8).map((breach, index) => (
                <div key={index} className="rounded-lg border border-border bg-surface-2 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{str(breach.name)}</span>
                    <span className="font-mono text-xs text-muted">{str(breach.date) ?? "-"}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {str(breach.domain) ?? "-"}
                    {breach.records ? ` · ${Number(breach.records).toLocaleString("id-ID")} catatan` : ""}
                  </p>
                  {arrStr(breach.dataClasses).length > 0 && (
                    <div className="mt-1.5">
                      <Chips items={arrStr(breach.dataClasses)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "ipgeolocation": {
      const connection = asRecord(data.connection);
      return (
        <div className="space-y-1">
          <DataRow label="Negara" value={str(data.country) ?? "-"} />
          <DataRow label="Wilayah" value={str(data.region) ?? "-"} />
          <DataRow label="Kota" value={str(data.city) ?? "-"} />
          <DataRow
            label="Koordinat"
            value={<span className="font-mono text-xs">{num(data.latitude) ?? "-"}, {num(data.longitude) ?? "-"}</span>}
          />
          <DataRow label="ASN" value={<span className="font-mono">{connection.asn ? `AS${connection.asn}` : "-"}</span>} />
          <DataRow label="ISP" value={str(connection.isp) ?? "-"} />
          <DataRow label="Organisasi" value={str(connection.org) ?? "-"} />
          <DataRow label="Zona waktu" value={str(data.timezone) ?? "-"} />
        </div>
      );
    }

    case "ripestat": {
      const asns = asArray(data.asns).map(asRecord);
      const block = asRecord(data.block);
      return (
        <div className="space-y-3">
          <DataRow label="Prefix" value={<span className="font-mono">{str(data.prefix) ?? "-"}</span>} />
          <DataRow label="Blok" value={<span className="font-mono text-xs">{str(block.resource) ?? "-"}</span>} />
          {asns.length > 0 ? (
            <div className="space-y-1">
              {asns.map((entry, index) => (
                <DataRow
                  key={index}
                  label={str(entry.asn) ?? "-"}
                  value={<span className="text-xs">{str(entry.holder) ?? "-"}</span>}
                />
              ))}
            </div>
          ) : (
            <EmptyNote>Tidak ada informasi ASN.</EmptyNote>
          )}
        </div>
      );
    }

    case "gdelt": {
      const articles = asArray(data.articles).map(asRecord);
      return (
        <div className="space-y-3">
          <DataRow label="Artikel" value={<span className="font-mono">{num(data.articleCount) ?? 0}</span>} />
          {articles.length > 0 ? (
            <div className="space-y-1.5">
              {articles.slice(0, 10).map((article, index) => (
                <div key={index} className="border-b border-border/60 pb-1.5 last:border-0">
                  <p className="text-sm">{str(article.title) ?? "(tanpa judul)"}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    {str(article.url) ? (
                      <ExternalAnchor href={String(article.url)}>{str(article.domain) ?? "sumber"}</ExternalAnchor>
                    ) : (
                      <span>{str(article.domain) ?? "-"}</span>
                    )}
                    {str(article.seenDate) && <span className="font-mono">{str(article.seenDate)?.slice(0, 8)}</span>}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyNote>Tidak ada berita ditemukan.</EmptyNote>
          )}
        </div>
      );
    }

    case "wikidata": {
      const entities = asArray(data.entities).map(asRecord);
      return (
        <div className="space-y-2">
          {entities.length > 0 ? (
            entities.map((entity, index) => (
              <div key={index} className="border-b border-border/60 pb-2 last:border-0">
                <p className="text-sm font-medium">
                  {str(entity.url) ? (
                    <ExternalAnchor href={String(entity.url)}>{str(entity.label) ?? String(entity.id)}</ExternalAnchor>
                  ) : (
                    str(entity.label) ?? String(entity.id)
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {str(entity.id)} · {str(entity.description) ?? "tanpa deskripsi"}
                </p>
              </div>
            ))
          ) : (
            <EmptyNote>Tidak ada entitas ditemukan.</EmptyNote>
          )}
        </div>
      );
    }

    case "sec-edgar": {
      const companies = asArray(data.companies).map(asRecord);
      return (
        <div className="space-y-2">
          {companies.length > 0 ? (
            companies.map((company, index) => (
              <div key={index} className="rounded-lg border border-border bg-surface-2 p-2.5">
                <p className="text-sm font-medium">
                  {str(company.url) ? (
                    <ExternalAnchor href={String(company.url)}>
                      {str(company.name) ?? `CIK ${str(company.cik)}`}
                    </ExternalAnchor>
                  ) : (
                    str(company.name) ?? `CIK ${str(company.cik)}`
                  )}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted">
                  CIK {str(company.cik) ?? "-"}
                  {arrStr(company.tickers).length > 0 ? ` · ${arrStr(company.tickers).join(", ")}` : ""}
                </p>
                {str(company.sicDescription) && (
                  <p className="mt-0.5 text-xs text-muted">{str(company.sicDescription)}</p>
                )}
              </div>
            ))
          ) : (
            <EmptyNote>Tidak ada perusahaan ditemukan.</EmptyNote>
          )}
        </div>
      );
    }

    case "wayback": {
      const topUrls = asArray(data.topUrls).map(asRecord);
      return (
        <div className="space-y-3">
          <div className="flex gap-4">
            <DataRow
              label="Snapshot"
              value={
                <span className="font-mono">
                  {num(data.snapshotCount) ?? 0}
                  {bool(data.truncated) ? "+" : ""}
                </span>
              }
            />
            <DataRow label="Arsip pertama" value={<span className="font-mono text-xs">{formatCompactDate(data.earliestSnapshot)}</span>} />
          </div>
          <DataRow label="Arsip terakhir" value={<span className="font-mono text-xs">{formatCompactDate(data.latestSnapshot)}</span>} />
          {topUrls.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Contoh URL terarsip</p>
              <StoryList
                items={topUrls.slice(0, 8).map((item) => ({
                  title: item.url ? shortUrl(String(item.url)) : "-",
                  url: str(item.url),
                  meta: [str(item.status), formatCompactDate(item.timestamp)]
                    .filter(Boolean)
                    .join(" · "),
                }))}
              />
            </div>
          ) : (
            <EmptyNote>Tidak ada arsip ditemukan.</EmptyNote>
          )}
        </div>
      );
    }

    case "dns-doh": {
      const records = asRecord(data.records);
      return (
        <div className="space-y-3">
          <DataRow label="Penyedia email" value={str(data.mailProvider) ?? "-"} />
          {str(data.spf) && (
            <DataRow label="SPF" value={<span className="break-all font-mono text-xs">{str(data.spf)}</span>} />
          )}
          {str(data.dmarc) && (
            <DataRow label="DMARC" value={<span className="break-all font-mono text-xs">{str(data.dmarc)}</span>} />
          )}
          <RecordGroup label="A" items={arrStr(records.a)} tone="accent" />
          <RecordGroup label="AAAA" items={arrStr(records.aaaa)} tone="accent" />
          <RecordGroup label="MX" items={arrStr(records.mx)} />
          <RecordGroup label="NS" items={arrStr(records.ns)} />
          <RecordGroup label="TXT" items={arrStr(records.txt)} />
        </div>
      );
    }

    case "hackernews": {
      const stories = asArray(data.stories).map(asRecord);
      return (
        <div className="space-y-3">
          {bool(data.found) && <DataRow label="Profil HN" value={str(data.username) ?? "-"} />}
          <DataRow label="Hasil" value={<span className="font-mono">{num(data.storyCount) ?? stories.length}</span>} />
          {stories.length > 0 ? (
            <StoryList
              items={stories.slice(0, 8).map((story) => ({
                title: str(story.title) ?? "(tanpa judul)",
                url: str(story.url),
                meta: [
                  story.points != null ? `${num(story.points)} poin` : null,
                  str(story.author),
                  story.comments != null ? `${num(story.comments)} komentar` : null,
                ]
                  .filter(Boolean)
                  .join(" · "),
              }))}
            />
          ) : (
            <EmptyNote>Tidak ada hasil dari Hacker News.</EmptyNote>
          )}
        </div>
      );
    }

    case "github-search": {
      const repos = asArray(data.repositories).map(asRecord);
      return (
        <div className="space-y-3">
          <DataRow label="Total repositori" value={<span className="font-mono">{num(data.totalCount) ?? repos.length}</span>} />
          {repos.length > 0 ? (
            <div className="space-y-2">
              {repos.slice(0, 8).map((repo, index) => (
                <div key={index} className="border-b border-border/60 pb-2 last:border-0">
                  <p className="text-sm font-medium">
                    {str(repo.url) ? (
                      <ExternalAnchor href={String(repo.url)}>{str(repo.fullName) ?? "-"}</ExternalAnchor>
                    ) : (
                      str(repo.fullName) ?? "-"
                    )}
                  </p>
                  {str(repo.description) && <p className="mt-0.5 text-xs text-muted">{str(repo.description)}</p>}
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    ★ {num(repo.stars) ?? 0}
                    {str(repo.language) ? ` · ${str(repo.language)}` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyNote>Tidak ada repositori ditemukan.</EmptyNote>
          )}
        </div>
      );
    }

    case "wikipedia": {
      const articles = asArray(data.articles).map(asRecord);
      return (
        <div className="space-y-2">
          {articles.length > 0 ? (
            articles.slice(0, 8).map((article, index) => (
              <div key={index} className="border-b border-border/60 pb-2 last:border-0">
                <p className="text-sm font-medium">
                  {str(article.url) ? (
                    <ExternalAnchor href={String(article.url)}>{str(article.title) ?? "-"}</ExternalAnchor>
                  ) : (
                    str(article.title) ?? "-"
                  )}
                </p>
                {str(article.description) && <p className="mt-0.5 text-xs text-muted">{str(article.description)}</p>}
                {str(article.excerpt) && <p className="mt-0.5 text-xs text-muted">{str(article.excerpt)}</p>}
              </div>
            ))
          ) : (
            <EmptyNote>Tidak ada artikel ditemukan.</EmptyNote>
          )}
        </div>
      );
    }

    case "stackexchange": {
      const questions = asArray(data.questions).map(asRecord);
      return (
        <div className="space-y-3">
          <DataRow label="Pertanyaan" value={<span className="font-mono">{num(data.questionCount) ?? questions.length}</span>} />
          {questions.length > 0 ? (
            <div className="space-y-2">
              {questions.slice(0, 8).map((question, index) => (
                <div key={index} className="border-b border-border/60 pb-2 last:border-0">
                  <p className="text-sm">
                    {str(question.link) ? (
                      <ExternalAnchor href={String(question.link)}>{str(question.title) ?? "-"}</ExternalAnchor>
                    ) : (
                      str(question.title) ?? "-"
                    )}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted">
                    skor {num(question.score) ?? 0} · {num(question.answers) ?? 0} jawaban
                    {bool(question.answered) ? " · terjawab" : ""}
                  </p>
                  {arrStr(question.tags).length > 0 && (
                    <div className="mt-1">
                      <Chips items={arrStr(question.tags)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyNote>Tidak ada pertanyaan ditemukan.</EmptyNote>
          )}
        </div>
      );
    }

    case "github-user": {
      if (!bool(data.found)) return <EmptyNote>Pengguna GitHub ini tidak ditemukan.</EmptyNote>;
      const repos = asArray(data.repositories).map(asRecord);
      return (
        <div className="space-y-3">
          <DataRow label="Nama" value={str(data.name) ?? str(data.login) ?? "-"} />
          {str(data.bio) && <DataRow label="Bio" value={str(data.bio)} />}
          {str(data.company) && <DataRow label="Perusahaan" value={str(data.company)} />}
          {str(data.location) && <DataRow label="Lokasi" value={str(data.location)} />}
          <DataRow label="Repositori" value={<span className="font-mono">{num(data.publicRepos) ?? 0}</span>} />
          <DataRow label="Pengikut" value={<span className="font-mono">{num(data.followers) ?? 0}</span>} />
          {str(data.blog) && (
            <DataRow label="Blog" value={<ExternalAnchor href={String(data.blog)}>{shortUrl(String(data.blog))}</ExternalAnchor>} />
          )}
          {repos.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Repositori terbaru</p>
              <Chips items={repos.map((repo) => str(repo.name) ?? "").filter(Boolean)} tone="accent" />
            </div>
          )}
        </div>
      );
    }

    case "gitlab-user": {
      if (!bool(data.found)) return <EmptyNote>Pengguna GitLab ini tidak ditemukan.</EmptyNote>;
      const projects = asArray(data.projects).map(asRecord);
      return (
        <div className="space-y-3">
          <DataRow label="Nama" value={str(data.name) ?? "-"} />
          {str(data.jobTitle) && <DataRow label="Jabatan" value={str(data.jobTitle)} />}
          {str(data.location) && <DataRow label="Lokasi" value={str(data.location)} />}
          <DataRow label="Status" value={str(data.state) ?? "-"} />
          {projects.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Proyek</p>
              <Chips items={projects.map((project) => str(project.name) ?? "").filter(Boolean)} tone="accent" />
            </div>
          )}
        </div>
      );
    }

    case "keybase": {
      if (!bool(data.found)) return <EmptyNote>Pengguna Keybase ini tidak ditemukan.</EmptyNote>;
      const proofs = arrStr(data.proofs);
      return (
        <div className="space-y-3">
          <DataRow label="Username" value={str(data.login) ?? "-"} />
          {str(data.fullName) && <DataRow label="Nama" value={str(data.fullName)} />}
          {str(data.location) && <DataRow label="Lokasi" value={str(data.location)} />}
          <DataRow label="Terdaftar" value={<span className="font-mono text-xs">{formatCompactDate(data.registeredAt)}</span>} />
          {str(data.keyId) && <DataRow label="Key ID" value={<span className="break-all font-mono text-xs">{str(data.keyId)}</span>} />}
          {proofs.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Proof sosial</p>
              <Chips items={proofs} tone="accent" />
            </div>
          )}
        </div>
      );
    }

    case "gravatar": {
      if (!bool(data.found)) return <EmptyNote>Tidak ada profil Gravatar untuk email ini.</EmptyNote>;
      const accounts = asArray(data.verifiedAccounts).map(asRecord);
      return (
        <div className="space-y-3">
          <DataRow label="Nama tampilan" value={str(data.displayName) ?? "-"} />
          {str(data.jobTitle) && <DataRow label="Jabatan" value={str(data.jobTitle)} />}
          {str(data.company) && <DataRow label="Perusahaan" value={str(data.company)} />}
          {str(data.location) && <DataRow label="Lokasi" value={str(data.location)} />}
          {str(data.description) && <DataRow label="Deskripsi" value={str(data.description)} />}
          {accounts.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted">Akun terverifikasi</p>
              <div className="flex flex-wrap gap-1.5">
                {accounts.map((account, index) =>
                  str(account.url) ? (
                    <ExternalAnchor key={index} href={String(account.url)}>
                      {str(account.service) ?? "akun"}
                    </ExternalAnchor>
                  ) : null,
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    case "phone-info": {
      if (!bool(data.parsed)) {
        return <EmptyNote>Nomor tidak dapat diuraikan sebagai nomor telepon.</EmptyNote>;
      }
      return (
        <div className="space-y-1">
          <DataRow
            label="Valid"
            value={
              <span className={bool(data.valid) ? "font-mono text-success" : "font-mono text-warn"}>
                {bool(data.valid) ? "ya" : "tidak"}
              </span>
            }
          />
          <DataRow label="Format E.164" value={<span className="font-mono text-xs">{str(data.e164) ?? "-"}</span>} />
          <DataRow label="Nasional" value={<span className="font-mono text-xs">{str(data.national) ?? "-"}</span>} />
          <DataRow label="Internasional" value={<span className="font-mono text-xs">{str(data.international) ?? "-"}</span>} />
          <DataRow label="Negara" value={str(data.country) ?? "-"} />
          <DataRow label="Kode panggil" value={<span className="font-mono">{str(data.callingCode) ?? "-"}</span>} />
          <DataRow label="Jenis" value={str(data.typeLabel) ?? str(data.type) ?? "-"} />
        </div>
      );
    }

    case "numverify": {
      return (
        <div className="space-y-1">
          <DataRow
            label="Valid"
            value={
              <span className={bool(data.valid) ? "font-mono text-success" : "font-mono text-warn"}>
                {bool(data.valid) ? "ya" : "tidak"}
              </span>
            }
          />
          <DataRow label="Nomor" value={<span className="font-mono text-xs">{str(data.internationalFormat) ?? str(data.number) ?? "-"}</span>} />
          <DataRow label="Format lokal" value={<span className="font-mono text-xs">{str(data.localFormat) ?? "-"}</span>} />
          <DataRow label="Negara" value={str(data.countryName) ?? str(data.countryCode) ?? "-"} />
          {str(data.location) && <DataRow label="Wilayah" value={str(data.location)} />}
          <DataRow label="Operator" value={str(data.carrier) ?? "-"} />
          <DataRow label="Jenis saluran" value={str(data.lineType) ?? "-"} />
        </div>
      );
    }

    default:
      return (
        <pre className="overflow-x-auto text-xs text-muted">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      );
  }
}

export function SourceCard({ result }: { result: SourceResult }) {
  const agent = result.agent ? getAgent(result.agent) : undefined;
  return (
    <Panel className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{result.label}</h3>
          <div className="flex items-center gap-2">
            {agent && (
              <span className="rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] text-accent">
                {agent.label}
              </span>
            )}
            {typeof result.durationMs === "number" && result.status !== "loading" && (
              <span className="font-mono text-xs text-muted">{result.durationMs}ms</span>
            )}
          </div>
        </div>
        <SourceBadge status={result.status} />
      </div>
      {result.status === "loading" ? (
        <div className="h-16 animate-pulse rounded-lg bg-surface-2" />
      ) : result.status === "error" ? (
        <p className="text-sm text-danger">{result.error ?? "Sumber gagal dihubungi."}</p>
      ) : result.status === "empty" ? (
        <EmptyNote>Tidak ada data dari sumber ini.</EmptyNote>
      ) : (
        renderContent(result)
      )}
    </Panel>
  );
}
