import { createServerFn } from "@tanstack/react-start";
import { getEvent } from "@tanstack/react-start/server";
import { z } from "zod";

const ADMIN_PASSWORD = "nyler";
const KV_KEY = "bach_content_v1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getKV(): any | null {
  try {
    // Swapped getRequestEvent() for getEvent() to access the Nitro context
    const event = getEvent();
    return (event as any)?.context?.cloudflare?.env?.BACH_KV ?? null;
  } catch {
    return null;
  }
}

export const loadContent = createServerFn({ method: "GET" }).handler(async () => {
  const kv = getKV();
  if (!kv) return null;
  try {
    const raw = await kv.get(KV_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
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
    if (!kv) throw new Error("Storage not configured");
    await kv.put(KV_KEY, JSON.stringify(data.content));
    return { ok: true };
  });
