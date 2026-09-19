/**
 * Colour maths for the accent picker.
 *
 * A container accent is a plain 24-bit integer, so everything here round trips
 * through that. HSV rather than HSL: the picker's square is a saturation and
 * value plane, which is what the two stacked gradients actually describe.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsv {
  h: number;
  s: number;
  v: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const rgbToNumber = ({ r, g, b }: Rgb): number =>
  (clamp(Math.round(r), 0, 255) << 16) |
  (clamp(Math.round(g), 0, 255) << 8) |
  clamp(Math.round(b), 0, 255);

export const numberToRgb = (value: number): Rgb => ({
  r: (value >> 16) & 0xff,
  g: (value >> 8) & 0xff,
  b: value & 0xff,
});

export const toHex = (value: number): string =>
  `#${value.toString(16).padStart(6, "0")}`;

/** Accepts `#abc`, `#aabbcc` and the same without the hash. */
export const parseHex = (input: string): number | null => {
  const text = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(text)) {
    const [r, g, b] = text;
    return Number.parseInt(`${r}${r}${g}${g}${b}${b}`, 16);
  }
  return /^[0-9a-f]{6}$/i.test(text) ? Number.parseInt(text, 16) : null;
};

export const hsvToRgb = ({ h, s, v }: Hsv): Rgb => {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s, 0, 1);
  const value = clamp(v, 0, 1);

  const chroma = value * saturation;
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = value - chroma;

  const sector = Math.floor(hue / 60) % 6;
  const [r, g, b] = [
    [chroma, second, 0],
    [second, chroma, 0],
    [0, chroma, second],
    [0, second, chroma],
    [second, 0, chroma],
    [chroma, 0, second],
  ][sector];

  return {
    r: Math.round((r + base) * 255),
    g: Math.round((g + base) * 255),
    b: Math.round((b + base) * 255),
  };
};

export const rgbToHsv = ({ r, g, b }: Rgb): Hsv => {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }

  return { h: hue, s: max === 0 ? 0 : delta / max, v: max };
};
