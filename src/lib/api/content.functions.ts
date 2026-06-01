import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const ADMIN_PASSWORD = "nyler";
const KV_KEY = "bach_content_v1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getKV(): any | null {
  try {
    // 1. Try Nitro v3's global process proxy (the new standard)
    const env = (globalThis as any).process?.env;
    if (env?.BACH_KV) return env.BACH_KV;

    // 2. Fallback to hidden Request properties (checks both v3 and v2 locations)
    const request = getRequest() as any;
    return request?.runtime?.cloudflare?.env?.BACH_KV
        ?? request?.context?.cloudflare?.env?.BACH_KV
        ?? null;
  } catch (err) {
    console.error("Error accessing KV binding:", err);
    return null;
  }
}

export const loadContent = createServerFn({ method: "GET" }).handler(async () => {
  const kv = getKV();
  if (!kv) {
    console.warn("KV Storage not found during load! Falling back to default.");
    return null;
  }
  try {
    const raw = await kv.get(KV_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Failed to read from KV:", err);
    return null;
  }
});

const ContentSchema = z.object({
  password: z.string(),
  content: z.record(z.unknown()),
});

export const saveContent = createServerFn({ method: "POST" })
  .inputValidator(ContentSchema)
  .handler(async ({ data }) => {
    if (data.password !== ADMIN_PASSWORD) {
      throw new Error("Unauthorized");
    }

    const kv = getKV();
    if (!kv) {
      console.error("CRITICAL: KV Storage not configured during saveContent!");
      throw new Error("Storage not configured");
    }

    await kv.put(KV_KEY, JSON.stringify(data.content));
    console.log("✅ Successfully saved content to Cloudflare KV!");

    return { ok: true };
  });
