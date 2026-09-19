import { describe, expect, it } from "vitest";
import {
  hsvToRgb,
  numberToRgb,
  parseHex,
  rgbToHsv,
  rgbToNumber,
  toHex,
} from "@/lib/color";
import { extensionOf } from "@/lib/url";

describe("24-bit integers", () => {
  it("round trips through rgb", () => {
    for (const value of [0x000000, 0xffffff, 0x5865f2, 0x010203]) {
      expect(rgbToNumber(numberToRgb(value))).toBe(value);
    }
  });

  it("pads the hex to six digits", () => {
    expect(toHex(0x000000)).toBe("#000000");
    expect(toHex(0x0000ff)).toBe("#0000ff");
    expect(toHex(0x5865f2)).toBe("#5865f2");
  });

  it("clamps out-of-range channels rather than wrapping", () => {
    expect(rgbToNumber({ r: 300, g: -20, b: 255 })).toBe(0xff00ff);
  });
});

describe("hex parsing", () => {
  it("takes the long form, with or without the hash", () => {
    expect(parseHex("#5865f2")).toBe(0x5865f2);
    expect(parseHex("5865F2")).toBe(0x5865f2);
    expect(parseHex("  #5865f2  ")).toBe(0x5865f2);
  });

  it("expands the short form", () => {
    expect(parseHex("#abc")).toBe(0xaabbcc);
    expect(parseHex("f00")).toBe(0xff0000);
  });

  it("returns null for anything else", () => {
    for (const bad of ["", "#", "xyz", "#12345", "#1234567", "rgb(1,2,3)"]) {
      expect(parseHex(bad)).toBeNull();
    }
  });
});

describe("hsv", () => {
  it("round trips the primaries", () => {
    for (const value of [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0x00ffff]) {
      const rgb = numberToRgb(value);
      expect(rgbToNumber(hsvToRgb(rgbToHsv(rgb)))).toBe(value);
    }
  });

  it("round trips an arbitrary colour", () => {
    const rgb = numberToRgb(0x5865f2);
    expect(rgbToNumber(hsvToRgb(rgbToHsv(rgb)))).toBe(0x5865f2);
  });

  it("reads black and white as zero and full value", () => {
    expect(rgbToHsv({ r: 0, g: 0, b: 0 })).toMatchObject({ s: 0, v: 0 });
    expect(rgbToHsv({ r: 255, g: 255, b: 255 })).toMatchObject({ s: 0, v: 1 });
  });

  it("places the primaries on the right hues", () => {
    expect(Math.round(rgbToHsv({ r: 255, g: 0, b: 0 }).h)).toBe(0);
    expect(Math.round(rgbToHsv({ r: 0, g: 255, b: 0 }).h)).toBe(120);
    expect(Math.round(rgbToHsv({ r: 0, g: 0, b: 255 }).h)).toBe(240);
  });

  it("wraps a hue outside the circle", () => {
    expect(hsvToRgb({ h: 360, s: 1, v: 1 })).toEqual({ r: 255, g: 0, b: 0 });
    expect(hsvToRgb({ h: -120, s: 1, v: 1 })).toEqual({ r: 0, g: 0, b: 255 });
  });

  it("clamps saturation and value instead of overflowing", () => {
    expect(hsvToRgb({ h: 0, s: 5, v: 5 })).toEqual({ r: 255, g: 0, b: 0 });
    expect(hsvToRgb({ h: 0, s: -1, v: -1 })).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe("url extensions", () => {
  it("ignores dots in the host", () => {
    // A .dev domain with no file extension used to read as ".dev/opengraph-image".
    expect(extensionOf("https://embed.hugh.dev/opengraph-image")).toBe("");
    expect(extensionOf("https://a.co.uk/image")).toBe("");
  });

  it("reads the last path segment", () => {
    expect(extensionOf("https://example.com/a/b/hero.png")).toBe("png");
    expect(extensionOf("https://example.com/v1.2/hero.WEBP")).toBe("webp");
  });

  it("stops at the query and the fragment", () => {
    expect(extensionOf("https://example.com/hero.png?w=1")).toBe("png");
    expect(extensionOf("https://example.com/hero.png#x")).toBe("png");
    expect(extensionOf("https://example.com/hero?v=1.5")).toBe("");
  });
});
