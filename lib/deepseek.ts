import OpenAI from "openai";

export const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-flash";
export const DEEP_MODEL = process.env.DEEPSEEK_MODEL_PRO ?? "deepseek-v4-pro";

let client: OpenAI | null = null;

export function getDeepseekClient(): OpenAI | null {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new OpenAI({
      apiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    });
  }
  return client;
}

export function resolveModel(mode: "normal" | "deep"): string {
  return mode === "deep" ? DEEP_MODEL : DEFAULT_MODEL;
}
