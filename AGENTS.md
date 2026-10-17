<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Redline — project commands

Package manager: **bun** (fallback: pnpm). All commands run from repo root.

- `bun run dev` — dev server (Turbopack) at http://localhost:3000
- `bun run build` — production build (must be run after route/page changes)
- `bun run start` — serve the production build
- `bun run lint` — ESLint (flat config, `next lint` is removed in Next 16)
- `bun run typecheck` — `tsc --noEmit`
- `bun run test` — Vitest (run once); `bun run test:watch` to watch
- `bun run scripts/smoke-osint.ts` — live smoke test of the 9 OSINT adapters

Env: copy `.env.example` to `.env.local`. `DEEPSEEK_API_KEY` is required only for AI
reports (search works without it). Upstash vars are optional (in-memory fallback).

Notes: Cache Components + Partial Prefetching are enabled — dynamic routes must wrap
runtime data access (`params`, `useParams()`) in `<Suspense>`. Route handlers set
`maxDuration`. Keep all API keys server-side (never `NEXT_PUBLIC_`).
