import { NextResponse } from "next/server";
import { z } from "zod";
import { LIMITS } from "@/lib/constants";
import type { ComponentEmbedPayload } from "@/lib/payload";
import { parsePayload } from "@/lib/schema";
import { extractPage } from "@/lib/server/extract";
import { fetchPublicUrl } from "@/lib/server/fetchPage";
import { clientKey, rateLimit } from "@/lib/server/rateLimit";
import { normalizeUrl } from "@/lib/url";

export const runtime = "nodejs";

const RATE = { limit: 10, windowMs: 60_000 } as const;

const bodySchema = z.object({ url: z.string().min(1).max(LIMITS.mediaUrl) });

export interface ImportResponse {
  payload: ComponentEmbedPayload;
  source: "inline" | "linked";
}

const fail = (status: number, message: string) =>
  NextResponse.json({ error: message }, { status });

export async function POST(request: Request) {
  const limit = rateLimit(
    `import:${clientKey(request)}`,
    RATE.limit,
    RATE.windowMs,
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many imports. Try again shortly." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSeconds) } },
    );
  }

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return fail(400, "Send a URL to import.");

  // A bare host is what people paste, so fill in the scheme before anything
  // else looks at it.
  const page = await fetchPublicUrl(normalizeUrl(body.data.url));
  if (!page.ok) return fail(page.status, page.message);

  const extracted = extractPage(page.body, page.url);

  let json = extracted.inlineJson;
  let source: ImportResponse["source"] = "inline";

  // Discord prefers the inline script and ignores the link when both exist.
  if (json === null && extracted.linkedJsonUrl !== null) {
    const linked = await fetchPublicUrl(extracted.linkedJsonUrl);
    if (!linked.ok) return fail(linked.status, linked.message);
    json = linked.body;
    source = "linked";
  }

  if (json === null) {
    return fail(404, "This URL has no component embed.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return fail(422, "The component embed on this page is not valid JSON.");
  }

  const payload = parsePayload(parsed);
  if (!payload.ok) {
    return fail(422, `Discord would reject this payload — ${payload.error}`);
  }

  return NextResponse.json<ImportResponse>({ payload: payload.payload, source });
}
