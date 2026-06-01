import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const ADMIN_PASSWORD = "nyler";
const KV_KEY = "bach_content_v1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getKV(): any | null {
  try {
    const request = getRequest() as any;

    // Log every top-level key on the request so we can find where CF bindings live
    console.log("[getKV] request keys:", Object.keys(request ?? {}));
    console.log("[getKV] globalThis.process.env keys:", Object.keys((globalThis as any).process?.env ?? {}));

    // Try every plausible path
    const candidates = [
      (globalThis as any).process?.env?.BACH_KV,
      request?.runtime?.cloudflare?.env?.BACH_KV,
      request?.context?.cloudflare?.env?.BACH_KV,
      request?.cf?.env?.BACH_KV,
      request?.env?.BACH_KV,
      (globalThis as any).__env__?.BACH_KV,
      (globalThis as any).BACH_KV,
    ];

    console.log("[getKV] candidate results:", candidates.map((c, i) => `[${i}]: ${c != null ? "FOUND" : "null"}`));

    for (const c of candidates) {
      if (c != null) return c;
    }
    return null;
  } catch (err) {
    console.error("[getKV] Error:", err);
    return null;
  }
}

export const loadContent = createServerFn({ method: "GET" }).handler(async () => {
  const kv = getKV();
  if (!kv) {
    console.warn("[loadContent] KV not found, returning null");
    return null;
  }
  try {
    const raw = await kv.get(KV_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("[loadContent] KV read failed:", err);
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
      console.error("[saveContent] KV binding not found — cannot save");
      throw new Error("Storage not configured");
    }

    await kv.put(KV_KEY, JSON.stringify(data.content));
    console.log("[saveContent] ✅ Saved to KV");

    return { ok: true };
  });
