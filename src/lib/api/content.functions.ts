import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_PASSWORD = "nyler";
const KV_KEY = "bach_content_v1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getKV(): any | null {
  // Grab the database directly from the global cache we set in server.ts!
  return (globalThis as any)._cloudflareEnv?.BACH_KV ?? null;
}

export const loadContent = createServerFn({ method: "GET" }).handler(async () => {
  const kv = getKV();
  if (!kv) {
    console.warn("KV Storage not found! Falling back to default.");
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
      throw new Error("Storage not configured");
    }
    
    await kv.put(KV_KEY, JSON.stringify(data.content));
    console.log("✅ Successfully saved content to Cloudflare KV!");
    
    return { ok: true };
  });
