import { EMBED_TAG } from "@/lib/constants";

/**
 * Pulls the component embed out of a page.
 *
 * Reads the markup the same way Discord's crawler does: tags anywhere in the
 * document, matched on exact `id`, `rel` and `type` values.
 */

const TAG_PATTERN = /<(script|link)\b([^>]*)>/gi;
const ATTRIBUTE_PATTERN = /([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+)/g;

type Attributes = Record<string, string>;

const decodeEntities = (value: string): string =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#3[49];/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const parseAttributes = (source: string): Attributes => {
  const attributes: Attributes = {};
  for (const match of source.matchAll(ATTRIBUTE_PATTERN)) {
    const value = match[2].replace(/^["']|["']$/g, "");
    attributes[match[1].toLowerCase()] = decodeEntities(value);
  }
  return attributes;
};

export interface ExtractedPage {
  /** Raw JSON from the inline script, when the page has one. */
  inlineJson: string | null;
  /** Absolute href from the linked JSON tag, when the page has one. */
  linkedJsonUrl: string | null;
}

export const extractPage = (html: string, pageUrl: string): ExtractedPage => {
  let inlineJson: string | null = null;
  let linkedJsonUrl: string | null = null;

  for (const match of html.matchAll(TAG_PATTERN)) {
    const [tag, name, rawAttributes] = match;
    const attributes = parseAttributes(rawAttributes);

    if (name.toLowerCase() === "script") {
      if (
        inlineJson === null &&
        attributes.id === EMBED_TAG.id &&
        attributes.type === EMBED_TAG.mimeType
      ) {
        const start = (match.index ?? 0) + tag.length;
        const end = html.indexOf("</script", start);
        inlineJson = html.slice(start, end === -1 ? undefined : end).trim();
      }
      continue;
    }

    if (name.toLowerCase() === "link") {
      if (
        linkedJsonUrl === null &&
        attributes.rel === EMBED_TAG.rel &&
        attributes.type === EMBED_TAG.mimeType &&
        attributes.href
      ) {
        try {
          linkedJsonUrl = new URL(attributes.href, pageUrl).toString();
        } catch {
          linkedJsonUrl = null;
        }
      }
    }
  }

  return { inlineJson, linkedJsonUrl };
};
