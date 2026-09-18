import { describe, expect, it } from "vitest";
import {
  type ContainerNode,
  createContainer,
  createGalleryItem,
  createMediaGallery,
  createTextDisplay,
  toPayload,
} from "@/lib/document";
import {
  buildHash,
  decodeDocument,
  encodeDocument,
  readHash,
} from "@/lib/serialize";

const sample = (): ContainerNode => {
  const gallery = createMediaGallery();
  gallery.items = [createGalleryItem("https://example.com/a.png")];
  return createContainer([
    createTextDisplay("# Hello\n- one\ntwo"),
    gallery,
  ]);
};

describe("url serialization", () => {
  it("restores the document from a hash", () => {
    const root = sample();
    const restored = decodeDocument(encodeDocument(root));

    expect(restored).not.toBeNull();
    expect(toPayload(restored!)).toEqual(toPayload(root));
  });

  it("produces a hash safe to paste in a URL", () => {
    const encoded = encodeDocument(sample());
    expect(encoded).toMatch(/^[\w+$-]+$/);
    expect(readHash(buildHash(encoded))).toBe(encoded);
  });

  it("returns null instead of throwing on bad input", () => {
    expect(decodeDocument("not-a-payload")).toBeNull();
    expect(decodeDocument("")).toBeNull();
  });

  it("rejects a payload that is not a component embed", () => {
    const encoded = encodeDocument(sample()).slice(0, 12);
    expect(decodeDocument(encoded)).toBeNull();
  });

  it("reads nothing from a hash without the key", () => {
    expect(readHash("#other=1")).toBeNull();
    expect(readHash("")).toBeNull();
  });
});
