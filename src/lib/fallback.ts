import { ComponentType, LIMITS, MEDIA_FORMATS } from "@/lib/constants";
import type { ContainerNode } from "@/lib/document";
import { isComponentNode, walk } from "@/lib/tree";
import { extensionOf } from "@/lib/url";

/**
 * The Open Graph fallback, derived from the embed rather than typed in beside
 * it. Discord shows it only when a client cannot render a component embed, so
 * it should say what the embed says.
 */

export interface Fallback {
  title: string;
  description: string;
  image: string;
}

const HEADING = /^\s*#{1,3}\s+/;
const SUBTEXT = /^\s*-#\s+/;

/** Reduces one line of Discord markdown to the text a crawler should read. */
export const toPlainText = (line: string): string =>
  line
    .replace(HEADING, "")
    .replace(SUBTEXT, "")
    .replace(/^\s*>\s?/, "")
    .replace(/^\s*([*-]|\d+\.)\s+/, "")
    // A link keeps its label; a bare autolink keeps its target.
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<(https?:\/\/[^>]+)>/g, "$1")
    .replace(/\|\||\*\*\*|\*\*|~~|__|\*|_|`/g, "")
    .trim();

/** Cuts on a character boundary, so a multi-byte glyph is never split in half. */
export const trimToBytes = (value: string, maxBytes: number): string => {
  const encoder = new TextEncoder();
  if (encoder.encode(value).length <= maxBytes) return value;

  let out = "";
  for (const character of value) {
    if (encoder.encode(out + character).length > maxBytes) break;
    out += character;
  }
  return out.trimEnd();
};

const isImage = (url: string): boolean => {
  const extension = extensionOf(url);
  // No extension to judge by, so let it through.
  if (extension === "") return true;
  return (MEDIA_FORMATS.image as readonly string[]).includes(extension);
};

/** Every text line in the embed, in reading order, already stripped of markup. */
const linesOf = (root: ContainerNode): string[] => {
  const lines: string[] = [];
  walk(root, (node) => {
    if (!isComponentNode(node) || node.type !== ComponentType.TextDisplay) {
      return;
    }
    for (const line of node.content.split("\n")) {
      lines.push(line);
    }
  });
  return lines;
};

/** The first image the crawler can use: a thumbnail, or a gallery item. */
const imageOf = (root: ContainerNode): string => {
  let found = "";
  walk(root, (node) => {
    if (found.length > 0) return;
    if (isComponentNode(node)) {
      if (node.type === ComponentType.Thumbnail && isImage(node.url.trim())) {
        found = node.url.trim();
      }
      return;
    }
    // A gallery item, which carries no component type of its own.
    if (node.url.trim().length > 0 && isImage(node.url.trim())) {
      found = node.url.trim();
    }
  });
  return found.startsWith("http") ? found : "";
};

export const deriveFallback = (root: ContainerNode): Fallback => {
  const lines = linesOf(root);

  // A heading is the author's own title. Without one, the first line of prose is.
  let titleIndex = lines.findIndex(
    (line) => HEADING.test(line) && toPlainText(line).length > 0,
  );
  if (titleIndex === -1) {
    titleIndex = lines.findIndex((line) => toPlainText(line).length > 0);
  }

  const title = titleIndex === -1 ? "" : toPlainText(lines[titleIndex]);

  // Everything after the title becomes the description, subtext included: it
  // is the body of the card either way.
  const description = lines
    .slice(titleIndex + 1)
    .map(toPlainText)
    .filter((line) => line.length > 0)
    .join(" ");

  return {
    title: trimToBytes(title, LIMITS.ogTitleBytes),
    description: trimToBytes(description, LIMITS.ogDescriptionBytes),
    image: imageOf(root),
  };
};
