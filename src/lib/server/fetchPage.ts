import { REJECTION_MESSAGES, assertPublicUrl } from "@/lib/server/ssrf";

/** Outbound fetch policy for the import endpoint. */
export const FETCH_POLICY = {
  timeoutMs: 5_000,
  maxRedirects: 3,
  maxBytes: 2 * 1024 * 1024,
  userAgent:
    "ComponentEmbedBuilder/1.0 (+https://github.com/discord/discord-api-docs/pull/8606)",
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

const readCapped = async (response: Response): Promise<string | null> => {
  const reader = response.body?.getReader();
  if (!reader) return "";

  const decoder = new TextDecoder();
  const chunks: string[] = [];
  let size = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > FETCH_POLICY.maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(decoder.decode(value, { stream: true }));
  }
  chunks.push(decoder.decode());
  return chunks.join("");
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

      const body = await readCapped(response);
      if (body === null) {
        return { ok: false, status: 413, message: "That page is too large to read." };
      }

      return {
        ok: true,
        url,
        body,
        contentType: response.headers.get("content-type") ?? "",
      };
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
