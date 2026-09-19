import { describe, expect, it } from "vitest";
import { EMBED_TAG } from "@/lib/constants";
import {
  type ContainerNode,
  createContainer,
  createTextDisplay,
} from "@/lib/document";
import { OUTPUT_FORMATS } from "@/lib/generators";

const document = (content = "# Patch Notes\nWhat changed"): ContainerNode =>
  createContainer([createTextDisplay(content)]);

const format = (id: string) =>
  OUTPUT_FORMATS.find((candidate) => candidate.id === id)!;

describe("output formats", () => {
  it("every format produces something", () => {
    for (const output of OUTPUT_FORMATS) {
      expect(output.generate(document()).length).toBeGreaterThan(0);
    }
  });

  it("ships the Open Graph fallback alongside the payload", () => {
    const html = format("html").generate(document());
    expect(html).toContain('<meta property="og:title" content="Patch Notes" />');
    expect(html).toContain('<meta name="theme-color" content="#5865f2" />');
    expect(html).toContain(`<script id="${EMBED_TAG.id}" type="${EMBED_TAG.mimeType}">`);
  });

  it("escapes markup that would close the script tag", () => {
    const html = format("html").generate(document("</script><script>alert(1)"));
    expect(html).not.toContain("</script><script>alert(1)");
    expect(html).toContain("\\u003c/script>");
  });

  it("emits the payload alone for the linked JSON method", () => {
    const json = format("json").generate(document());
    expect(JSON.parse(json)).toHaveProperty("component.type", 17);
  });

  it("emits framework snippets that carry both halves", () => {
    for (const id of ["nextjs", "astro", "sveltekit"]) {
      const code = format(id).generate(document());
      expect(code).toContain(EMBED_TAG.id);
      expect(code).toContain("Patch Notes");
    }
  });

  it("escapes the payload inside framework snippets too", () => {
    for (const id of ["nextjs", "astro", "sveltekit"]) {
      expect(format(id).generate(document())).toContain("\\u003c");
    }
  });
});

/** Mirrors the detection in CodeBlock, which re-highlights the payload as JSON. */
const payloadLines = (code: string): [number, number] | null => {
  const lines = code.split("\n");
  const open = lines.findIndex(
    (line) =>
      line.trimStart().startsWith("<script") &&
      line.includes('type="application/json"'),
  );
  if (open === -1) return null;
  const close = lines.findIndex(
    (line, index) => index > open && line.trim() === "</script>",
  );
  return close > open + 1 ? [open + 1, close - 1] : null;
};

describe("the payload inside a snippet", () => {
  it("is found in the formats that embed it raw", () => {
    for (const id of ["html", "agent"]) {
      const code = format(id).generate(document());
      const region = payloadLines(code);
      expect(region).not.toBeNull();

      const payload = code
        .split("\n")
        .slice(region![0], region![1] + 1)
        .join("\n");
      expect(JSON.parse(payload)).toHaveProperty("component.type", 17);
    }
  });

  it("is left alone where the language already highlights it", () => {
    // SvelteKit builds the same tag from a template literal, which must not
    // be mistaken for the real thing.
    for (const id of ["json", "nextjs", "astro", "sveltekit"]) {
      expect(payloadLines(format(id).generate(document()))).toBeNull();
    }
  });
});
