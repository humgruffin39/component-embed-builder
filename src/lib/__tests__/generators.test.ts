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
