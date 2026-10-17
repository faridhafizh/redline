# Product Requirements Document (PRD)
## OSINT Research Web App — "Project [Nama Kamu]"

**Versi:** 1.0
**Tanggal:** 17 Oktober 2026
**Status:** Draft
**Author:** [Nama Kamu]
**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + Vercel + DeepSeek API

---

## 1. Ringkasan Eksekutif

Aplikasi web berbasis OSINT (Open Source Intelligence) yang memungkinkan pengguna melakukan riset terpadu melalui satu *search bar* tunggal, mirip Google. Sistem akan secara otomatis memanggil berbagai sumber data publik (domain, IP, email, telepon), lalu menggunakan **DeepSeek API** untuk menganalisis, mengorelasikan, dan merangkum temuan menjadi laporan intelijen yang koheren dan mudah dipahami.

Tujuan utama: **demokratisasi OSINT** — membuat riset intelijen yang biasanya rumit dan tersebar di banyak tool menjadi satu alur kerja yang mulus, cepat, dan gratis.

---

## 2. Latar Belakang & Masalah

### Masalah yang Diselesaikan
- **Fragmentasi tool**: Peneliti OSINT harus membuka banyak situs/tool terpisah (Shodan, RDAP, crt.sh, HIBP, dll.) untuk satu target riset.
- **Data mentah tanpa konteks**: Hasil dari API OSINT berupa JSON/teknis yang sulit dipahami non-praktisi.
- **Biaya**: Banyak tool OSINT berbayar, menghalangi peneliti pemula atau independen.
- **Tidak ada analisis**: Tool yang ada jarang mengorelasikan temuan antar-sumber atau memberikan kesimpulan.

### Peluang
Integrasi LLM (DeepSeek) memungkinkan transformasi data mentah multi-sumber menjadi analisis naratif yang bernilai, dengan biaya sangat rendah (~$0.14/1M token input).

---

## 3. Tujuan & Metrik Keberhasilan

### Tujuan Produk
| # | Tujuan | Metrik Keberhasilan |
|---|--------|---------------------|
| G1 | Menyediakan pencarian OSINT multi-sumber dalam satu antarmuka | ≥ 5 sumber data terintegrasi pada rilis v1.0 |
| G2 | Memberikan analisis AI yang akurat dan relevan | ≥ 85% pengguna menilai hasil analisis "berguna" |
| G3 | Respons cepat dan andal | Waktu muat hasil awal < 3 detik; tingkat kegagalan < 5% |
| G4 | Berjalan tanpa biaya API OSINT | 100% sumber data gratis (no-key atau free tier) |
| G5 | Aman dan tidak disalahgunakan | Rate limit aktif; 0 kebocoran API key |

### Non-Goals (v1.0)
- Tidak ada fitur kolaborasi tim / multi-user workspace.
- Tidak ada penyimpanan riwayat pencarian persisten (kecuali di sisi klien).
- Tidak ada integrasi sumber berbayar (Shodan full, Dehashed, dll.).
- Tidak ada fitur *monitoring* berkelanjutan (continuous monitoring).

---

## 4. Target Pengguna

| Persona | Deskripsi | Kebutuhan Utama |
|---------|-----------|-----------------|
| **Security Researcher** | Analis keamanan yang melakukan *recon* terhadap domain/IP | Data teknis cepat, IOC extraction, korelasi antar-sumber |
| **Journalist / Investigator** | Jurnalis yang melakukan *background check* | Ringkasan naratif, verifikasi entitas |
| **Bug Bounty Hunter** | Mencari *attack surface* | Enumerasi subdomain, port terbuka, CVE |
| **Mahasiswa / Pemula OSINT** | Belajar OSINT | Antarmuka sederhana, hasil terjelaskan |

---

## 5. Ruang Lingkup Fitur

### 5.1 Fitur Inti (P0 — Wajib untuk v1.0)

#### F1. Search Bar Universal
- Input tunggal yang menerima: domain, IP, email, username, nomor telepon, atau kata kunci.
- Deteksi otomatis tipe input (*auto-classification*) dan pemilihan sumber yang relevan.
- Validasi input di sisi server.

#### F2. Multi-Source Data Fetching
Pemanggilan paralel ke sumber OSINT gratis menggunakan `Promise.allSettled`:

| Kategori | Sumber | Auth |
|----------|--------|------|
| IP/Infra | Shodan InternetDB | No-key |
| Domain | RDAP (rdap.org) | No-key |
| Domain | crt.sh (subdomain enumeration) | No-key |
| Email | XposedOrNot | No-key |
| IP/Geo | ipgeolocationapi.io | No-key |
| ASN/BGP | RIPEstat | No-key |
| Publik | SEC EDGAR, GDELT, Wikidata | No-key |

- Setiap sumber menampilkan status (loading / success / failed) secara independen di UI.
- Kegagalan satu sumber tidak menggagalkan keseluruhan pencarian.

#### F3. AI Analysis Layer (DeepSeek)
- Data mentah yang terkumpul dikirim ke **DeepSeek API** (`deepseek-flash`).
- Output AI berupa:
  - **Ringkasan Eksekutif** (2–4 kalimat).
  - **Temuan Utama** (bullet points terstruktur).
  - **Korelasi Antar-Sumber** (jika ada pola).
  - **Rekomendasi / Next Steps**.
- Respons menggunakan **streaming** agar teks muncul bertahap.
- *Guardrail*: AI diinstruksikan hanya menggunakan data yang diberikan (anti-halusinasi).

#### F4. Hasil Terstruktur & Visual
- Tampilan tab per kategori (Domain / IP / Email / dll.).
- *Raw data viewer* (JSON collapsible) untuk pengguna teknis.
- Indikator visual status per sumber.

#### F5. Keamanan & Rate Limiting
- Semua API key di environment variable server-side (tanpa `NEXT_PUBLIC_`).
- Rate limiting per IP menggunakan `@upstash/ratelimit` (Upstash Redis).
- Validasi & sanitasi input ketat.

### 5.2 Fitur Sekunder (P1 — Nice to Have)

| # | Fitur | Deskripsi |
|---|-------|-----------|
| F6 | Riwayat Pencarian Lokal | Disimpan di `localStorage` (tanpa backend) |
| F7 | Export Laporan | Unduh hasil analisis AI sebagai Markdown/PDF |
| F8 | Dark Mode | Tema gelap default (gaya "terminal"), toggle terang |
| F9 | Deep Analysis Mode | Opsi menggunakan `deepseek-v4-pro` untuk analisis mendalam (on-demand) |
| F10 | Peta Geolokasi | Tampilkan IP di peta (MapLibre GL) |

### 5.3 Fitur Masa Depan (P2 — v2.0+)

- Autentikasi pengguna (NextAuth.js) + riwayat persisten.
- Integrasi tool Python (PhoneInfoga, Blackbird) sebagai microservice.
- Continuous monitoring & alert.
- Sumber berbayar opsional (Shodan full, Dehashed).

---

## 6. Arsitektur Teknis

### 6.1 Stack
| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 14+ (App Router) |
| Bahasa | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| AI | DeepSeek API (via `openai` SDK) |
| Rate Limit / Cache | Upstash Redis (`@upstash/ratelimit`) |
| Deployment | Vercel (Fluid Compute aktif) |

### 6.2 Alur Data
```
[User Input]
     │
     ▼
[Frontend: Search Bar] ──► POST /api/search
     │
     ▼
[API Route: Auto-classify input]
     │
     ├──► Fan-out: Promise.allSettled([Shodan, RDAP, crt.sh, XposedOrNot, ...])
     │         │
     │         ▼
     │    [Normalisasi hasil per sumber]
     │
     ▼
[DeepSeek API — stream: true]
     │  (system prompt: anti-halusinasi + format output)
     │
     ▼
[ReadableStream ──► Frontend]
     │
     ▼
[UI: Render hasil bertahap + tab per kategori]
```

### 6.3 Struktur Direktori (ringkas)
```
/app
  /api
    /search/route.ts        # Fan-out OSINT fetch
    /analyze/route.ts       # DeepSeek streaming analysis
  /search/[query]/page.tsx  # Halaman hasil
  layout.tsx
  page.tsx                  # Landing + search bar
/lib
  deepseek.ts               # Client wrapper
  osint/
    shodan.ts, rdap.ts, crtsh.ts, xposedornot.ts, ...
  ratelimit.ts
  types.ts                  # Interface per-sumber & hasil gabungan
/components
  SearchBar.tsx, ResultTabs.tsx, SourceStatus.tsx, AIReport.tsx
```

### 6.4 Tipe Data (Contoh)
```typescript
type SourceStatus = 'loading' | 'success' | 'error';
type SourceResult<T> = { source: string; status: SourceStatus; data?: T; error?: string };

interface OsintAggregate {
  query: string;
  type: 'domain' | 'ip' | 'email' | 'phone' | 'username' | 'keyword';
  results: Record<string, SourceResult<unknown>>;
  timestamp: string;
}
```

---

## 7. Integrasi DeepSeek — Spesifikasi

### 7.1 Konfigurasi
- Model default: **`deepseek-flash`**
- `baseURL`: `https://api.deepseek.com`
- `temperature`: 0.2 (faktual)
- `stream`: `true`

### 7.2 Prompt Template (System)
```
Anda adalah analis OSINT ahli. Gunakan HANYA informasi dari data yang diberikan.
Jangan menambahkan pengetahuan eksternal atau membuat asumsi.
Jika data tidak ada, tulis "Tidak ada data".

Keluarkan hasil dalam format:
1. Ringkasan Eksekutif
2. Temuan Utama (bullet)
3. Korelasi Antar-Sumber
4. Rekomendasi / Next Steps
```

### 7.3 Batasan
- Hindari alias `deepseek-chat` / `deepseek-reasoner` (deprecated 24 Juli 2026).
- Batas token input: kirim data yang sudah dinormalisasi & dipangkas.
- Estimasi biaya: ~$0.0001 per pencarian (model flash).

---

## 8. Keamanan

| Risiko | Mitigasi |
|--------|----------|
| Kebocoran API key | Server-side env vars, tanpa `NEXT_PUBLIC_`, tipe "Secret" di Vercel |
| Penyalahgunaan endpoint | Rate limit per IP (Upstash), validasi input |
| Prompt injection via data OSINT | Sanitasi data sebelum dikirim ke LLM; instruksi tegas di system prompt |
| Injection attack | Validasi & escape input di server |
| Informasi bocor di build | Nonaktifkan `productionBrowserSourceMaps`, hapus header `X-Powered-By` |
| Kebocoran data antar-user | Tidak ada state server-side di v1.0 (stateless) |

---

## 9. Performa & Reliabilitas

| Aspek | Target | Implementasi |
|-------|--------|--------------|
| First contentful paint | < 1.5s | SSR + streaming |
| Hasil awal muncul | < 3s | Streaming per-sumber |
| Analisis AI selesai | < 15s | Streaming token |
| Tingkat kegagalan total | < 5% | `Promise.allSettled` + fallback UI |
| Cold start | diminimalkan | Fluid Compute + cron warming opsional |
| Caching | respon < 500ms untuk query berulang | Upstash Redis (TTL 1–24 jam) |

---

## 10. Deployment

- **Platform**: Vercel
- **Konfigurasi wajib**:
  - ✅ Aktifkan **Fluid Compute** (timeout hingga 5 menit di paket gratis)
  - ✅ Gunakan **Route Handlers** (`app/api/*/route.ts`) untuk streaming (bukan `pages/api`)
  - ✅ Environment variables: `DEEPSEEK_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **CI/CD**: GitHub → Vercel (preview per PR, prod per merge ke `main`)
- **Monitoring**: Vercel Analytics + log fungsi (error rate, latency)

---

## 11. Rencana Rilis (Milestone)

| Fase | Durasi | Deliverable |
|------|--------|-------------|
| **M1 — Fondasi** | Minggu 1 | Setup Next.js + TS + Tailwind, landing page + search bar, struktur API route |
| **M2 — Data Layer** | Minggu 2 | Integrasi Shodan InternetDB, RDAP, crt.sh, XposedOrNot, ipgeolocationapi.io; normalisasi tipe |
| **M3 — AI Layer** | Minggu 3 | DeepSeek client, `/api/analyze` dengan streaming, prompt & guardrail, UI rendering bertahap |
| **M4 — Hardening** | Minggu 4 | Rate limiting (Upstash), caching, error handling, security checklist, deploy Vercel |
| **v1.0 Launch** | Akhir Minggu 4 | Rilis publik, uji coba dengan 5–10 beta user |

---

## 12. Risiko & Asumsi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| crt.sh lambat/flaky | UX terganggu | Retry + timeout + tampilkan status per-sumber |
| Rate limit sumber gratis tercapai | Pencarian gagal sebagian | Caching agresif + fallback sumber alternatif |
| Halusinasi LLM | Hasil menyesatkan | System prompt ketat + hanya data yang diberikan |
| Biaya DeepSeek membengkak | Tagihan naik | Rate limit + model flash sebagai default + cache analisis |
| Perubahan API pihak ketiga | Fitur rusak | Interface adapter per-sumber; mudah diganti |
| Timeout Vercel | Analisis gagal | Fluid Compute + streaming |

**Asumsi**: Sumber gratis tersedia untuk penggunaan non-komersial; pengguna menyadari hasil bersifat indikatif.

---

## 13. Kriteria Penerimaan (Definition of Done v1.0)

- [ ] Pengguna dapat memasukkan domain/IP/email dan menerima hasil dari ≥ 5 sumber.
- [ ] Setiap sumber menampilkan status loading/success/error secara independen.
- [ ] Analisis AI muncul secara streaming dan mengikuti format 4-bagian.
- [ ] Tidak ada API key yang terekspos di bundle klien.
- [ ] Rate limit aktif dan teruji.
- [ ] Aplikasi berhasil deploy di Vercel dengan Fluid Compute aktif.
- [ ] Uji coba dengan ≥ 5 beta user menunjukkan ≥ 85% rating "berguna".

---

## 14. Lampiran

- **Referensi API**: Shodan InternetDB, rdap.org, crt.sh, XposedOrNot, ipgeolocationapi.io, RIPEstat
- **Dokumentasi DeepSeek**: kompatibel OpenAI SDK
- **Referensi Proyek**: SeekYou, Sightline, osint-mcp (untuk pola arsitektur)

---

*Dokumen ini bersifat living document dan akan diperbarui seiring iterasi produk.*