import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { type ContainerNode, fromPayload, toPayload } from "@/lib/document";
import { parsePayload } from "@/lib/schema";

/**
 * The whole document lives in the URL hash, so a link restores an editor
 * session without any server-side storage.
 */

export const HASH_KEY = "s";

/** Past this, some clients start truncating pasted links. */
export const HASH_LENGTH_WARNING = 8_000;

interface SharedState {
  v: 1;
  p: unknown;
}

export const encodeDocument = (root: ContainerNode): string => {
  const state: SharedState = { v: 1, p: toPayload(root) };
  return compressToEncodedURIComponent(JSON.stringify(state));
};

/** Returns null for anything unreadable; a broken link falls back to defaults. */
export const decodeDocument = (encoded: string): ContainerNode | null => {
  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const state = JSON.parse(json) as SharedState;
    if (state?.v !== 1) return null;
    const parsed = parsePayload(state.p);
    if (!parsed.ok) return null;
    return fromPayload(parsed.payload);
  } catch {
    return null;
  }
};

/**
 * Read by hand rather than with URLSearchParams: lz-string's alphabet contains
 * `+`, which form decoding would turn into a space.
 */
export const readHash = (hash: string): string | null => {
  for (const part of hash.replace(/^#/, "").split("&")) {
    const separator = part.indexOf("=");
    if (separator !== -1 && part.slice(0, separator) === HASH_KEY) {
      return part.slice(separator + 1);
    }
  }
  return null;
};

export const buildHash = (encoded: string): string =>
  `#${HASH_KEY}=${encoded}`;
