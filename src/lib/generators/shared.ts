import { EMBED_TAG } from "@/lib/constants";
import type { ContainerNode } from "@/lib/document";
import { toPayload } from "@/lib/document";
import { deriveFallback } from "@/lib/fallback";

export const toHexColor = (color: number | null): string | null =>
  color === null ? null : `#${color.toString(16).padStart(6, "0")}`;

export const formatPayload = (root: ContainerNode): string =>
  JSON.stringify(toPayload(root), null, 2);

export const minifyPayload = (root: ContainerNode): string =>
  JSON.stringify(toPayload(root));

/** `</script>` inside a JSON block would close the tag early. */
export const escapeForScript = (json: string): string =>
  json.replace(/</g, "\\u003c");

export const escapeAttribute = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const indent = (text: string, spaces: number): string => {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line.length > 0 ? pad + line : line))
    .join("\n");
};

interface MetaTag {
  key: "property" | "name";
  field: string;
  value: string;
}

/**
 * The Open Graph fallback, read off the embed itself. `og:url` and
 * `og:site_name` are left out on purpose: they describe the page, not the
 * embed, so nothing here could tell the truth about them.
 */
export const metaTags = (root: ContainerNode): MetaTag[] => {
  const { title, description, image } = deriveFallback(root);
  const themeColor = toHexColor(root.accentColor);
  const tags: MetaTag[] = [];
  const push = (key: MetaTag["key"], field: string, value: string) => {
    if (value.trim().length > 0) tags.push({ key, field, value: value.trim() });
  };
  push("property", "og:title", title);
  push("property", "og:description", description);
  push("property", "og:image", image);
  push("property", "og:type", "website");
  push("name", "twitter:card", "summary_large_image");
  if (themeColor) push("name", "theme-color", themeColor);
  return tags;
};

export const metaTagsHtml = (root: ContainerNode): string =>
  metaTags(root)
    .map(
      ({ key, field, value }) =>
        `<meta ${key}="${field}" content="${escapeAttribute(value)}" />`,
    )
    .join("\n");

export const embedScriptHtml = (root: ContainerNode): string =>
  [
    `<script id="${EMBED_TAG.id}" type="${EMBED_TAG.mimeType}">`,
    escapeForScript(formatPayload(root)),
    `</script>`,
  ].join("\n");
