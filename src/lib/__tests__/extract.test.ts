import { describe, expect, it } from "vitest";
import { extractPage } from "@/lib/server/extract";

const page = (head: string) =>
  `<!DOCTYPE html><html><head>${head}</head><body><h1>Hi</h1></body></html>`;

const PAYLOAD = '{"component":{"type":17,"components":[]}}';

describe("inline script", () => {
  it("reads the payload when id and type match exactly", () => {
    const html = page(
      `<script id="discord:component-embed" type="application/json">${PAYLOAD}</script>`,
    );
    expect(extractPage(html, "https://example.com").inlineJson).toBe(PAYLOAD);
  });

  it("ignores scripts with the wrong id or type", () => {
    const wrongId = page(
      `<script id="component-embed" type="application/json">${PAYLOAD}</script>`,
    );
    const wrongType = page(
      `<script id="discord:component-embed" type="application/ld+json">${PAYLOAD}</script>`,
    );
    expect(extractPage(wrongId, "https://example.com").inlineJson).toBeNull();
    expect(extractPage(wrongType, "https://example.com").inlineJson).toBeNull();
  });

  it("handles single quotes and reordered attributes", () => {
    const html = page(
      `<script type='application/json' id='discord:component-embed'>${PAYLOAD}</script>`,
    );
    expect(extractPage(html, "https://example.com").inlineJson).toBe(PAYLOAD);
  });
});

describe("linked json", () => {
  it("resolves the href against the page", () => {
    const html = page(
      `<link rel="discord:component-embed" type="application/json" href="/embed.json">`,
    );
    expect(extractPage(html, "https://example.com/post").linkedJsonUrl).toBe(
      "https://example.com/embed.json",
    );
  });

  it("ignores links with the wrong rel", () => {
    const html = page(
      `<link rel="alternate" type="application/json" href="/embed.json">`,
    );
    expect(extractPage(html, "https://example.com").linkedJsonUrl).toBeNull();
  });
});
