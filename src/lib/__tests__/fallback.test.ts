import { describe, expect, it } from "vitest";
import { LIMITS } from "@/lib/constants";
import {
  createContainer,
  createGalleryItem,
  createMediaGallery,
  createSection,
  createTextDisplay,
  createThumbnail,
} from "@/lib/document";
import { deriveFallback, toPlainText, trimToBytes } from "@/lib/fallback";

describe("plain text", () => {
  it("strips the markers Discord renders", () => {
    expect(toPlainText("## **Big** news")).toBe("Big news");
    expect(toPlainText("-# a footnote")).toBe("a footnote");
    expect(toPlainText("- a bullet")).toBe("a bullet");
    expect(toPlainText("> quoted")).toBe("quoted");
    expect(toPlainText("~~gone~~ and ||hidden||")).toBe("gone and hidden");
  });

  it("keeps a link's label, not its target", () => {
    expect(toPlainText("[Read more](https://example.com)")).toBe("Read more");
  });
});

describe("byte trimming", () => {
  it("leaves anything within the limit alone", () => {
    expect(trimToBytes("short", 70)).toBe("short");
  });

  it("counts bytes, not characters", () => {
    const trimmed = trimToBytes("あ".repeat(40), LIMITS.ogTitleBytes);
    expect(new TextEncoder().encode(trimmed).length).toBeLessThanOrEqual(
      LIMITS.ogTitleBytes,
    );
  });

  it("never splits a multi-byte character", () => {
    // 70 bytes is not a multiple of 3, so a naive slice would cut one in half.
    const trimmed = trimToBytes("あ".repeat(40), LIMITS.ogTitleBytes);
    expect(trimmed).toBe("あ".repeat(23));
  });
});

describe("derived fallback", () => {
  it("takes the heading as the title and the rest as the description", () => {
    const root = createContainer([
      createTextDisplay("# Patch Notes\nThe dungeon got harder."),
    ]);
    expect(deriveFallback(root)).toMatchObject({
      title: "Patch Notes",
      description: "The dungeon got harder.",
    });
  });

  it("falls back to the first line when there is no heading", () => {
    const root = createContainer([
      createTextDisplay("Just a line.\nAnd another."),
    ]);
    expect(deriveFallback(root)).toMatchObject({
      title: "Just a line.",
      description: "And another.",
    });
  });

  it("reads text nested inside a section", () => {
    const section = createSection();
    section.components = [createTextDisplay("# Nested\nBody copy")];
    expect(deriveFallback(createContainer([section])).title).toBe("Nested");
  });

  it("uses the first thumbnail as the image", () => {
    const section = createSection();
    section.components = [createTextDisplay("# Title")];
    section.accessory = {
      ...createThumbnail(),
      url: "https://example.com/hero.png",
    };
    expect(deriveFallback(createContainer([section])).image).toBe(
      "https://example.com/hero.png",
    );
  });

  it("uses a gallery image when there is no thumbnail", () => {
    const gallery = createMediaGallery();
    gallery.items = [createGalleryItem("https://example.com/a.webp")];
    expect(deriveFallback(createContainer([gallery])).image).toBe(
      "https://example.com/a.webp",
    );
  });

  it("skips a video, which og:image cannot use", () => {
    const gallery = createMediaGallery();
    gallery.items = [createGalleryItem("https://example.com/clip.mp4")];
    expect(deriveFallback(createContainer([gallery])).image).toBe("");
  });

  it("trims a long title to the byte limit", () => {
    const root = createContainer([
      createTextDisplay(`# ${"x".repeat(200)}`),
    ]);
    expect(deriveFallback(root).title.length).toBeLessThanOrEqual(
      LIMITS.ogTitleBytes,
    );
  });

  it("returns empty fields for an empty container", () => {
    expect(deriveFallback(createContainer([]))).toEqual({
      title: "",
      description: "",
      image: "",
    });
  });
});
