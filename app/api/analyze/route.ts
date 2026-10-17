import type { NextRequest } from "next/server";
import { z } from "zod";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/analysis";
import { getDeepseekClient, resolveModel } from "@/lib/deepseek";
import { getClientIp, rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

const ANALYZE_RATE_LIMIT = 10;

const sourceResultSchema = z.object({
  source: z.string().max(60),
  label: z.string().max(80),
  category: z.string().max(40),
  status: z.string().max(20),
  data: z.unknown().optional(),
  error: z.string().max(500).optional(),
  durationMs: z.number().optional(),
});

const analyzeSchema = z.object({
  query: z.string().min(1).max(200),
  type: z.enum(["domain", "ip", "email", "phone", "username", "keyword"]),
  mode: z.enum(["normal", "deep"]).optional().default("normal"),
  results: z.array(sourceResultSchema).max(20),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const limit = await rateLimit(ip, ANALYZE_RATE_LIMIT);
  if (!limit.success) {
    return Response.json(
      { error: "Terlalu banyak permintaan analisis. Coba lagi sebentar lagi." },
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

  const parsed = analyzeSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "Parameter analisis tidak valid." },
      { status: 400 },
    );
  }

  const client = getDeepseekClient();
  if (!client) {
    return Response.json(
      {
        error:
          "Analisis AI tidak tersedia: DEEPSEEK_API_KEY belum dikonfigurasi.",
      },
      { status: 503 },
    );
  }

  const { query, type, mode } = parsed.data;
  const results = parsed.data.results as Parameters<typeof buildUserPrompt>[2];
  const model = resolveModel(mode);

  const encoder = new TextEncoder();
  let stream: ReadableStream<Uint8Array>;

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(query, type, results) },
      ],
    });

    stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Analisis gagal";
          controller.enqueue(encoder.encode(`\n\n[ERROR] ${message}`));
        } finally {
          controller.close();
        }
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `Gagal menghubungi DeepSeek: ${error.message}`
            : "Gagal menghubungi DeepSeek.",
      },
      { status: 502 },
    );
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
