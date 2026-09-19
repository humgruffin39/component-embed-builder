import { EMBED_TAG } from "@/lib/constants";
import type { ContainerNode } from "@/lib/document";
import { deriveFallback } from "@/lib/fallback";
import {
  embedScriptHtml,
  formatPayload,
  indent,
  metaTagsHtml,
  toHexColor,
} from "@/lib/generators/shared";

export type OutputFormatId =
  | "html"
  | "json"
  | "nextjs"
  | "astro"
  | "sveltekit"
  | "agent";

export interface OutputFormat {
  id: OutputFormatId;
  label: string;
  filename: string;
  /** Where this snippet goes, for anyone who has not done this before. */
  hint: string;
  /** Shiki grammar for the snippet. */
  language: "html" | "json" | "tsx" | "astro" | "svelte" | "markdown";
  generate: (root: ContainerNode) => string;
}

/** The six characters an escaped `<` is written as, not the character itself. */
const ESCAPED_LT = String.raw`\u003c`;

/** Keeps a `</script>` inside the payload from closing the tag early. */
const SAFE_JSON = 'JSON.stringify(embed).replace(/</g, "\\u003c")';

/** The heading a snippet's own page body shows, taken from the embed. */
const pageHeading = (root: ContainerNode): string =>
  deriveFallback(root).title || "Your page";

const htmlFormat: OutputFormat = {
  id: "html",
  language: "html",
  label: "HTML",
  filename: "index.html",
  hint: "Both tags go in your <head>",
  generate: (root) => `${metaTagsHtml(root)}\n\n${embedScriptHtml(root)}`,
};

const jsonFormat: OutputFormat = {
  id: "json",
  language: "json",
  label: "JSON",
  filename: "embed.json",
  hint: "Host this, then link it from your <head>",
  generate: formatPayload,
};

const nextFormat: OutputFormat = {
  id: "nextjs",
  language: "tsx",
  label: "Next.js",
  filename: "app/page.tsx",
  hint: "Replaces your page file",
  generate: (root) => {
    const { title, description, image } = deriveFallback(root);
    const themeColor = toHexColor(root.accentColor);

    const openGraph = [
      title && `    title: ${JSON.stringify(title)},`,
      description && `    description: ${JSON.stringify(description)},`,
      image && `    images: [${JSON.stringify(image)}],`,
      `    type: "website",`,
    ]
      .filter(Boolean)
      .join("\n");

    const head = [
      title && `  title: ${JSON.stringify(title)},`,
      description && `  description: ${JSON.stringify(description)},`,
    ]
      .filter(Boolean)
      .join("\n");

    return `import type { Metadata } from "next";

const embed = ${formatPayload(root)};

const embedJson = ${SAFE_JSON};

export const metadata: Metadata = {
${head ? `${head}\n` : ""}  openGraph: {
${openGraph}
  },
  twitter: { card: "summary_large_image" },${
    themeColor
      ? `\n  other: { "theme-color": ${JSON.stringify(themeColor)} },`
      : ""
  }
};

export default function Page() {
  return (
    <>
      <script
        id="${EMBED_TAG.id}"
        type="${EMBED_TAG.mimeType}"
        dangerouslySetInnerHTML={{ __html: embedJson }}
      />
      <main>
        <h1>${pageHeading(root)}</h1>
      </main>
    </>
  );
}
`;
  },
};

const astroFormat: OutputFormat = {
  id: "astro",
  language: "astro",
  label: "Astro",
  filename: "src/pages/index.astro",
  hint: "Replaces your page file",
  generate: (root) => `---
const embed = ${formatPayload(root)};

const embedJson = ${SAFE_JSON};
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
${indent(metaTagsHtml(root), 4)}
    <script id="${EMBED_TAG.id}" type="${EMBED_TAG.mimeType}" is:inline set:html={embedJson} />
  </head>
  <body>
    <h1>${pageHeading(root)}</h1>
  </body>
</html>
`,
};

const svelteFormat: OutputFormat = {
  id: "sveltekit",
  language: "svelte",
  label: "SvelteKit",
  filename: "src/routes/+page.svelte",
  hint: "Replaces your page file",
  generate: (root) => `<script lang="ts">
  const embed = ${indent(formatPayload(root), 2).trimStart()};

  const embedJson = ${SAFE_JSON};

  const openTag = \`<script id="${EMBED_TAG.id}" type="${EMBED_TAG.mimeType}">\`;
  const closeTag = "<" + "/script>";
</script>

<svelte:head>
${indent(metaTagsHtml(root), 2)}
  {@html openTag + embedJson + closeTag}
</svelte:head>

<h1>${pageHeading(root)}</h1>
`,
};

/**
 * For handing to a coding agent instead of pasting by hand. It has to carry
 * the rules, not just the payload: the exact tag, the escaping, and the fact
 * that the crawler runs no JavaScript are what a model gets wrong.
 */
const promptFormat: OutputFormat = {
  id: "agent",
  language: "markdown",
  label: "Agent",
  filename: "Prompt",
  hint: "Paste into your coding agent",
  generate: (root) => `Add a Discord component embed to this page, so a shared link shows this card
instead of the usual preview. Use whatever templating this project already uses.

Both tags go in the page's \`<head>\`, rendered on the server. Discord's crawler
runs no JavaScript.

\`\`\`html
${embedScriptHtml(root)}
\`\`\`

The \`id\` and \`type\` must match exactly. The JSON above already escapes \`<\`
as \`${ESCAPED_LT}\`; keep it that way or the script tag ends early.

Do not add keys to the JSON, \`id\` and \`custom_id\` included. Discord rejects the
whole payload when it meets a key it does not expect.

These are the fallback, shown when a client cannot render the embed:

\`\`\`html
${metaTagsHtml(root)}
\`\`\`
`,
};

export const OUTPUT_FORMATS: OutputFormat[] = [
  promptFormat,
  htmlFormat,
  jsonFormat,
  nextFormat,
  astroFormat,
  svelteFormat,
];
