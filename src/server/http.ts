import "server-only";
import { z } from "zod";
import { IntegrationError } from "./klaviyo/client";

const maxBytes = 16_384;
const headers = { "Cache-Control": "no-store" };

function allowsOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const source = new URL(origin);
    // Next.js may normalize request.url to localhost behind its server adapter.
    // Use the HTTP Host authority; never trust a client-supplied forwarded host.
    const authority = request.headers.get("host") ?? new URL(request.url).host;
    return (source.protocol === "http:" || source.protocol === "https:") && source.host === authority;
  } catch { return false; }
}

export function jsonRoute<T>(schema: z.ZodType<T>, operation: (input: T) => Promise<unknown>, guard?: () => Promise<void>) {
  return async function POST(request: Request) {
    try {
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
        throw new IntegrationError(415, "unsupported_media_type", "Send an application/json request.");
      }
      if (!allowsOrigin(request)) {
        throw new IntegrationError(403, "origin_not_allowed", "This origin is not allowed.");
      }
      if (guard) await guard();
      const reader = request.body?.getReader();
      if (!reader) throw new IntegrationError(400, "invalid_json", "A JSON body is required.");
      let size = 0;
      let raw = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          await reader.cancel();
          throw new IntegrationError(413, "payload_too_large", "The request is too large.");
        }
        raw += decoder.decode(value, { stream: true });
      }
      raw += decoder.decode();
      let value: unknown;
      try { value = JSON.parse(raw); } catch {
        throw new IntegrationError(400, "invalid_json", "The request body is not valid JSON.");
      }
      const parsed = schema.safeParse(value);
      if (!parsed.success) throw new IntegrationError(400, "invalid_input", "Check the required fields and their values.");
      const result = await operation(parsed.data);
      const accepted = !!result && typeof result === "object" && "status" in result && result.status === "accepted";
      return Response.json(result, { status: accepted ? 202 : 200, headers });
    } catch (error) {
      if (error instanceof IntegrationError) return Response.json({ error: error.code, message: error.message }, { status: error.status, headers: { ...headers, ...(error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {}) } });
      return Response.json({ error: "integration_unavailable", message: "The operation could not be completed." }, { status: 500, headers });
    }
  };
}
