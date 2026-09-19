import type { SVGProps } from "react";

/**
 * Wireframes of what each component looks like once placed. "Section" and
 * "Action Row" mean nothing on their own; the shape carries it.
 */

type GlyphProps = SVGProps<SVGSVGElement>;

const Frame = ({ children, ...props }: GlyphProps) => (
  <svg viewBox="0 0 28 18" aria-hidden="true" {...props}>
    {children}
  </svg>
);

const line = (x: number, y: number, w: number, dim = false) => (
  <rect
    key={`${x}-${y}`}
    x={x}
    y={y}
    width={w}
    height="2.4"
    rx="1.2"
    fill="currentColor"
    opacity={dim ? 0.4 : 0.85}
  />
);

export const TextGlyph = (props: GlyphProps) => (
  <Frame {...props}>
    {line(2, 3, 24)}
    {line(2, 8, 20, true)}
    {line(2, 13, 14, true)}
  </Frame>
);

export const SectionGlyph = (props: GlyphProps) => (
  <Frame {...props}>
    {line(2, 4, 15)}
    {line(2, 9, 12, true)}
    <rect
      x="19"
      y="3"
      width="7"
      height="7"
      rx="1.5"
      fill="currentColor"
      opacity="0.85"
    />
  </Frame>
);

export const GalleryGlyph = (props: GlyphProps) => (
  <Frame {...props}>
    {[0, 1].map((row) =>
      [0, 1, 2].map((column) => (
        <rect
          key={`${row}-${column}`}
          x={2 + column * 8.6}
          y={3 + row * 7}
          width="7"
          height="5.6"
          rx="1.2"
          fill="currentColor"
          opacity={row === 0 ? 0.85 : 0.4}
        />
      )),
    )}
  </Frame>
);

export const SeparatorGlyph = (props: GlyphProps) => (
  <Frame {...props}>
    {line(2, 2, 24, true)}
    <rect x="2" y="8" width="24" height="1.6" rx="0.8" fill="currentColor" />
    {line(2, 14, 24, true)}
  </Frame>
);

export const ActionRowGlyph = (props: GlyphProps) => (
  <Frame {...props}>
    <rect
      x="2"
      y="5"
      width="11"
      height="8"
      rx="2"
      fill="currentColor"
      opacity="0.85"
    />
    <rect
      x="15"
      y="5"
      width="11"
      height="8"
      rx="2"
      fill="currentColor"
      opacity="0.4"
    />
  </Frame>
);

export const ThumbnailGlyph = (props: GlyphProps) => (
  <Frame {...props}>
    <rect
      x="9"
      y="2"
      width="10"
      height="14"
      rx="2"
      fill="currentColor"
      opacity="0.85"
    />
  </Frame>
);

export const ButtonGlyph = (props: GlyphProps) => (
  <Frame {...props}>
    <rect
      x="6"
      y="5"
      width="16"
      height="8"
      rx="2"
      fill="currentColor"
      opacity="0.85"
    />
  </Frame>
);

export const ItemGlyph = (props: GlyphProps) => (
  <Frame {...props}>
    <rect
      x="4"
      y="3"
      width="20"
      height="12"
      rx="2"
      fill="currentColor"
      opacity="0.85"
    />
  </Frame>
);
