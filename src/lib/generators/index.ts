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

export type OutputFormatId = "html" | "json" | "nextjs" | "astro" | "sveltekit";

export interface OutputFormat {
  id: OutputFormatId;
  label: string;
  filename: string;
  /** Shiki grammar for the snippet. */
  language: "html" | "json" | "tsx" | "astro" | "svelte";
  generate: (root: ContainerNode) => string;
}

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
  generate: (root) => `${metaTagsHtml(root)}\n\n${embedScriptHtml(root)}`,
};

const jsonFormat: OutputFormat = {
  id: "json",
  language: "json",
  label: "JSON",
  filename: "embed.json",
  generate: formatPayload,
};

const nextFormat: OutputFormat = {
  id: "nextjs",
  language: "tsx",
  label: "Next.js",
  filename: "app/page.tsx",
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
  generate: (root) => `<script lang="ts">
  const embed = ${indent(formatPayload(root), 2).trimStart()};

  const embedJson = ${SAFE_JSON};

  // Written out in parts so the compiler does not read it as the end of this block.
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

export const OUTPUT_FORMATS: OutputFormat[] = [
  htmlFormat,
  jsonFormat,
  nextFormat,
  astroFormat,
  svelteFormat,
];
