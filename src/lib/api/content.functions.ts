import { createServerFn } from "@tanstack/react-start";
// @ts-ignore
import { getEvent } from "vinxi/http";
import { z } from "zod";

const ADMIN_PASSWORD = "nyler";
const KV_KEY = "bach_content_v1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getKV(): any | null {
  try {
    const event = getEvent();
    const ctx = (event as any)?.context;

    // The Ultimate Catch-All: Check every place Cloudflare or Nitro could hide the database
    const db = ctx?.cloudflare?.env?.BACH_KV 
      || ctx?.env?.BACH_KV 
      || (globalThis as any)?.BACH_KV 
      || (globalThis as any)?.__env__?.BACH_KV 
      || (globalThis as any)?.process?.env?.BACH_KV;

    if (!db) {
      console.error("🚨 DATABASE NOT FOUND IN CONTEXT!");
      console.error("- Context keys available:", ctx ? Object.keys(ctx) : "none");
      if (ctx?.cloudflare?.env) {
         console.error("- Cloudflare Env keys available:", Object.keys(ctx.cloudflare.env));
      }
    }

    return db || null;
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
      throw new Error("Storage not configured");
    }
    
    await kv.put(KV_KEY, JSON.stringify(data.content));
    console.log("✅ Successfully saved content to Cloudflare KV!");
    
    return { ok: true };
  });
