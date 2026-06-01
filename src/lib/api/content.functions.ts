import { createServerFn } from "@tanstack/react-start";
import { getRequestEvent } from "@tanstack/react-start/server";
import { z } from "zod";

const ADMIN_PASSWORD = "nyler";
const KV_KEY = "bach_content_v1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getKV(): any | null {
  try {
    const event = getRequestEvent();
    // Nitro Cloudflare Workers adapter exposes bindings at event.context.cloudflare.env
    const env = (event as any)?.context?.cloudflare?.env;
    return env?.BACH_KV ?? null;
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
    if (!kv) throw new Error("KV binding not available — check BACH_KV is configured in wrangler.jsonc");
    await kv.put(KV_KEY, JSON.stringify(data.content));
    return { ok: true };
  });
