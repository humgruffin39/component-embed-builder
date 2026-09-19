import { REJECTION_MESSAGES, assertPublicUrl } from "@/lib/server/ssrf";

/** Outbound fetch policy for the import endpoint. */
export const FETCH_POLICY = {
  timeoutMs: 5_000,
  maxRedirects: 3,
  maxBytes: 2 * 1024 * 1024,
  userAgent:
    "ComponentEmbedBuilder/1.0 (+https://github.com/humgruffin39/component-embed-builder)",
} as const;

export interface FetchSuccess {
  ok: true;
  url: string;
  body: string;
  contentType: string;
}

export interface FetchFailure {
  ok: false;
  status: number;
  message: string;
}

export type FetchResult = FetchSuccess | FetchFailure;

/** `charset=` from a Content-Type, or from a `<meta>` in the first bytes. */
export const charsetOf = (contentType: string, head: string): string => {
  const header = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType);
  if (header) return header[1].toLowerCase();

  const metaCharset = /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(head);
  if (metaCharset) return metaCharset[1].toLowerCase();

  return "utf-8";
};

/**
 * Reads the body, capped, and decodes it in the encoding the page declares.
 * Shift_JIS and EUC-JP are still out there. Guessing UTF-8 mangles them.
 */
const readCapped = async (
  response: Response,
  contentType: string,
): Promise<string | null> => {
  const reader = response.body?.getReader();
  if (!reader) return "";

  const parts: Uint8Array[] = [];
  let size = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > FETCH_POLICY.maxBytes) {
      await reader.cancel();
      return null;
    }
    parts.push(value);
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    body.set(part, offset);
    offset += part.byteLength;
  }

  // The declaration itself is ASCII, so a provisional read is enough to find it.
  const head = new TextDecoder("utf-8").decode(body.subarray(0, 2048));
  const charset = charsetOf(contentType, head);

  try {
    return new TextDecoder(charset).decode(body);
  } catch {
    // An encoding this runtime does not know; UTF-8 is the better guess.
    return new TextDecoder("utf-8").decode(body);
  }
};

/**
 * Fetches a public URL, re-checking the destination on every redirect so a
 * public host cannot bounce the request into a private network.
 */
export const fetchPublicUrl = async (target: string): Promise<FetchResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_POLICY.timeoutMs);

  try {
    let url = target;

    for (let hop = 0; hop <= FETCH_POLICY.maxRedirects; hop += 1) {
      const rejection = await assertPublicUrl(url);
      if (rejection) {
        return { ok: false, status: 400, message: REJECTION_MESSAGES[rejection] };
      }

      const response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": FETCH_POLICY.userAgent,
          accept: "text/html,application/xhtml+xml,application/json",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          return { ok: false, status: 502, message: "The site sent a redirect without a target." };
        }
        await response.body?.cancel();
        url = new URL(location, url).toString();
        continue;
      }

      if (!response.ok) {
        return {
          ok: false,
          status: 502,
          message: `The site responded with ${response.status}.`,
        };
      }

      const contentType = response.headers.get("content-type") ?? "";
      const body = await readCapped(response, contentType);
      if (body === null) {
        return { ok: false, status: 413, message: "That page is too large to read." };
      }

      return { ok: true, url, body, contentType };
    }

    return { ok: false, status: 502, message: "Too many redirects." };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      status: aborted ? 504 : 502,
      message: aborted ? "That site took too long to respond." : "That site could not be reached.",
    };
  } finally {
    clearTimeout(timeout);
  }
};
