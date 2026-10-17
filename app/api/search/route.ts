import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  planAgents,
  runningAgent,
  summarizeAgent,
} from "@/lib/agents";
import { cacheKey, getCacheStore, getCacheTtl } from "@/lib/cache";
import { classifyQuery } from "@/lib/classify";
import { getAdapter, withTimeout } from "@/lib/osint";
import { getClientIp, rateLimit } from "@/lib/ratelimit";
import type { SearchEvent, SourceResult } from "@/lib/types";
import { getUnsupportedNotice } from "@/lib/unsupported";

export const maxDuration = 60;

const SOURCE_TIMEOUT_MS = 25_000;
const SEARCH_RATE_LIMIT = 20;

const searchSchema = z.object({
  query: z.string().min(1).max(200),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const limit = await rateLimit(ip, SEARCH_RATE_LIMIT);
  if (!limit.success) {
    return Response.json(
      {
        error: "Terlalu banyak permintaan. Coba lagi sebentar lagi.",
        reset: limit.reset,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000)),
          ),
        },
      },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid." }, { status: 400 });
  }

  const parsed = searchSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "Parameter 'query' tidak valid. Panjang 1-200 karakter." },
      { status: 400 },
    );
  }

  const raw = parsed.data.query.trim();
  const { type, query } = classifyQuery(raw);

  if (!query) {
    return Response.json({ error: "Query kosong." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const store = await getCacheStore();
  const plan = planAgents(type);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: SearchEvent) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      const timestamp = new Date().toISOString();

      try {
        if (plan.length === 0) {
          const notice = getUnsupportedNotice(type, query);
          send({
            type: "meta",
            query,
            queryType: type,
            sources: [],
            agents: [],
            cached: false,
            timestamp,
          });
          send({ type: "notice", message: notice.message, links: notice.links });
          send({ type: "done", timestamp });
          return;
        }

        const sources = plan.flatMap((agent) => agent.sources);
        const key = cacheKey(type, query);
        const cached = await store.get<SourceResult[]>(key);

        send({
          type: "meta",
          query,
          queryType: type,
          sources: sources.map((source) => source.id),
          agents: plan.map((agent) => agent.id),
          cached: Boolean(cached),
          timestamp,
        });

        if (cached && cached.length > 0) {
          for (const result of cached) send({ type: "source", result });
          for (const agent of plan) {
            const agentResults = cached.filter(
              (result) => result.agent === agent.id,
            );
            send({ type: "agent", agent: summarizeAgent(agent, agentResults) });
          }
          send({ type: "done", timestamp });
          return;
        }

        const allResults: SourceResult[] = [];

        await Promise.all(
          plan.map(async (agent) => {
            send({ type: "agent", agent: runningAgent(agent) });

            const results = await Promise.all(
              agent.sources.map(async (definition): Promise<SourceResult> => {
                const startedAt = Date.now();
                const base = {
                  source: definition.id,
                  label: definition.label,
                  category: definition.category,
                  agent: agent.id,
                };

                try {
                  const output = await withTimeout(
                    getAdapter(definition.id)(query, type),
                    definition.label,
                    SOURCE_TIMEOUT_MS,
                  );
                  const result: SourceResult = {
                    ...base,
                    status: output.empty ? "empty" : "success",
                    data: output.data,
                    durationMs: Date.now() - startedAt,
                  };
                  send({ type: "source", result });
                  return result;
                } catch (error) {
                  const result: SourceResult = {
                    ...base,
                    status: "error",
                    error:
                      error instanceof Error
                        ? error.message
                        : "Sumber gagal dihubungi",
                    durationMs: Date.now() - startedAt,
                  };
                  send({ type: "source", result });
                  return result;
                }
              }),
            );

            allResults.push(...results);
            send({ type: "agent", agent: summarizeAgent(agent, results) });
          }),
        );

        await store.set(key, allResults, getCacheTtl(type));
        send({ type: "done", timestamp: new Date().toISOString() });
      } catch (error) {
        send({
          type: "error",
          message:
            error instanceof Error ? error.message : "Terjadi kesalahan tak terduga",
        });
      } finally {
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
