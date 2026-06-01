import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ADMIN_PASSWORD = "nyler";
const KV_KEY = "bach_content_v1";

// 1. Make this an async function to support dynamic imports
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getKV(): Promise<any | null> {
  try {
    // 2. Hide the import string in a variable and use @vite-ignore. 
    // This tricks Vite into completely ignoring the import during the browser build, 
    // preventing the Rollup crash, while still working perfectly on the server!
    const vinxi = "vinxi/http";
    const { getEvent } = await import(/* @vite-ignore */ vinxi);
    
    const event = getEvent();
    return event?.context?.cloudflare?.env?.BACH_KV ?? null;
  } catch (err) {
    console.error("Vinxi event error:", err);
    return null;
  }
}

export const loadContent = createServerFn({ method: "GET" }).handler(async () => {
  // 3. Add 'await' here since getKV is now async
  const kv = await getKV(); 
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
    
    // 4. Add 'await' here
    const kv = await getKV();
    
    if (!kv) {
      // If it STILL fails, this will throw the exact global keys to your screen
      // so we can see exactly what Cloudflare is doing under the hood.
      const gKeys = Object.keys(globalThis).filter(k => k.toLowerCase().includes('env') || k.includes('cf')).join(', ');
      throw new Error(`Storage missing. Globals found: ${gKeys || 'none'}`);
    }
    
    await kv.put(KV_KEY, JSON.stringify(data.content));
    console.log("✅ Successfully saved content to Cloudflare KV!");
    
    return { ok: true };
  });
