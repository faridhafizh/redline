import type { QueryType, SourceDefinition, SourceId } from "../types";

export const SOURCES: SourceDefinition[] = [
  {
    id: "shodan-internetdb",
    label: "Shodan InternetDB",
    category: "ip",
    description: "Port terbuka, hostname, CVE, dan tag pada alamat IP",
    supports: ["ip"],
    url: "https://internetdb.shodan.io",
  },
  {
    id: "rdap",
    label: "RDAP",
    category: "domain",
    description: "Data registrasi domain & IP (WHOIS modern)",
    supports: ["domain", "ip"],
    url: "https://rdap.org",
  },
  {
    id: "crtsh",
    label: "crt.sh",
    category: "domain",
    description: "Enumerasi subdomain dari Certificate Transparency logs",
    supports: ["domain"],
    url: "https://crt.sh",
  },
  {
    id: "xposedornot",
    label: "XposedOrNot",
    category: "email",
    description: "Pemeriksaan kebocoran data untuk alamat email",
    supports: ["email"],
    url: "https://xposedornot.com",
  },
  {
    id: "ipgeolocation",
    label: "IP Geolokasi",
    category: "ip",
    description: "Lokasi, ASN, dan jaringan dari alamat IP",
    supports: ["ip"],
    url: "https://ipwho.is",
  },
  {
    id: "ripestat",
    label: "RIPEstat",
    category: "ip",
    description: "Informasi jaringan, ASN, dan prefix BGP",
    supports: ["ip"],
    url: "https://stat.ripe.net",
  },
  {
    id: "gdelt",
    label: "GDELT",
    category: "keyword",
    description: "Berita dan liputan media global",
    supports: ["keyword"],
    url: "https://www.gdeltproject.org",
  },
  {
    id: "wikidata",
    label: "Wikidata",
    category: "keyword",
    description: "Entitas dan pengetahuan terstruktur",
    supports: ["keyword"],
    url: "https://www.wikidata.org",
  },
  {
    id: "sec-edgar",
    label: "SEC EDGAR",
    category: "keyword",
    description: "Dokumen dan perusahaan terdaftar di SEC",
    supports: ["keyword"],
    url: "https://www.sec.gov/edgar",
  },
  {
    id: "wayback",
    label: "Wayback Machine",
    category: "domain",
    description: "Riwayat arsip domain dari Internet Archive",
    supports: ["domain"],
    url: "https://web.archive.org",
  },
  {
    id: "dns-doh",
    label: "DNS (Cloudflare DoH)",
    category: "domain",
    description: "Catatan DNS A/AAAA/MX/NS/TXT, SPF & DMARC",
    supports: ["domain", "email"],
    url: "https://cloudflare-dns.com",
  },
  {
    id: "hackernews",
    label: "Hacker News",
    category: "keyword",
    description: "Diskusi dan tautan dari komunitas Hacker News",
    supports: ["keyword", "domain", "username"],
    url: "https://news.ycombinator.com",
  },
  {
    id: "github-search",
    label: "GitHub Search",
    category: "keyword",
    description: "Repositori publik di GitHub",
    supports: ["keyword", "domain"],
    url: "https://github.com/search",
  },
  {
    id: "wikipedia",
    label: "Wikipedia",
    category: "keyword",
    description: "Artikel ensiklopedia dan ringkasannya",
    supports: ["keyword"],
    url: "https://www.wikipedia.org",
  },
  {
    id: "stackexchange",
    label: "Stack Exchange",
    category: "keyword",
    description: "Pertanyaan teknis dari Stack Overflow",
    supports: ["keyword"],
    url: "https://stackoverflow.com",
  },
  {
    id: "github-user",
    label: "GitHub User",
    category: "identity",
    description: "Profil pengguna dan repositori publik GitHub",
    supports: ["username"],
    url: "https://github.com",
  },
  {
    id: "gitlab-user",
    label: "GitLab User",
    category: "identity",
    description: "Profil pengguna dan proyek publik GitLab",
    supports: ["username"],
    url: "https://gitlab.com",
  },
  {
    id: "keybase",
    label: "Keybase",
    category: "identity",
    description: "Profil terverifikasi lintas akun sosial",
    supports: ["username"],
    url: "https://keybase.io",
  },
  {
    id: "gravatar",
    label: "Gravatar",
    category: "email",
    description: "Profil publik yang tertaut ke alamat email",
    supports: ["email"],
    url: "https://gravatar.com",
  },
  {
    id: "phone-info",
    label: "Analisis Nomor Telepon",
    category: "identity",
    description: "Validasi format, negara, dan jenis nomor (lokal)",
    supports: ["phone"],
    url: "https://www.npmjs.com/package/libphonenumber-js",
  },
  {
    id: "numverify",
    label: "Numverify",
    category: "identity",
    description: "Operator, jenis saluran, dan lokasi nomor telepon",
    supports: ["phone"],
    url: "https://numverify.com",
    requiredEnv: "NUMVERIFY_API_KEY",
  },
];

export function isSourceConfigured(source: SourceDefinition): boolean {
  if (!source.requiredEnv) return true;
  if (typeof process === "undefined" || !process.env) return false;
  return Boolean(process.env[source.requiredEnv]);
}

export function getSourcesForType(type: QueryType): SourceDefinition[] {
  return SOURCES.filter(
    (source) => source.supports.includes(type) && isSourceConfigured(source),
  );
}

export function getSource(id: SourceId): SourceDefinition | undefined {
  return SOURCES.find((source) => source.id === id);
}
