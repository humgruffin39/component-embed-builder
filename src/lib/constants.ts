/**
 * Values confirmed against Discord's Link Previews documentation.
 * https://github.com/discord/discord-api-docs/pull/8606
 * (`developers/link-previews/overview.mdx`, `developers/link-previews/component-embeds.mdx`)
 */

/** Component type numbers usable inside a component embed. */
export const ComponentType = {
  ActionRow: 1,
  Button: 2,
  Section: 9,
  TextDisplay: 10,
  Thumbnail: 11,
  MediaGallery: 12,
  Separator: 14,
  Container: 17,
} as const;

/** Human names for the component types, shared by the tree and the preview. */
export const NODE_LABELS: Record<number, string> = {
  [ComponentType.ActionRow]: "Action Row",
  [ComponentType.Button]: "Link Button",
  [ComponentType.Section]: "Section",
  [ComponentType.TextDisplay]: "Text",
  [ComponentType.Thumbnail]: "Thumbnail",
  [ComponentType.MediaGallery]: "Gallery",
  [ComponentType.Separator]: "Separator",
  [ComponentType.Container]: "Container",
};

/** The only button style a component embed accepts. */
export const LINK_BUTTON_STYLE = 5;

export const LIMITS = {
  /** Total components in a payload, nested ones included. */
  components: 40,
  /** Raw response bytes for the linked-JSON delivery method. */
  linkedJsonBytes: 3_000,
  accentColorMax: 0xffffff,
  sectionTextMin: 1,
  sectionTextMax: 3,
  galleryItemsMin: 1,
  galleryItemsMax: 10,
  actionRowButtons: 5,
  buttonLabel: 80,
  buttonUrl: 512,
  mediaUrl: 2_048,
  mediaDescription: 1_024,
  /**
   * Open Graph fields, counted in bytes. Past these Discord trims, so the
   * derived fallback trims first and keeps the cut on a character boundary.
   */
  ogTitleBytes: 70,
  ogDescriptionBytes: 350,
} as const;

/** Formats Discord's crawler accepts for thumbnails and gallery items. */
export const MEDIA_FORMATS = {
  image: ["png", "gif", "jpg", "jpeg", "webp", "avif"],
  video: ["mp4", "mov", "webm"],
} as const;

/** Document-level identifiers Discord matches exactly. */
export const EMBED_TAG = {
  id: "discord:component-embed",
  rel: "discord:component-embed",
  mimeType: "application/json",
} as const;

export const REPO_URL = "https://github.com/humgruffin39/component-embed-builder";

export const DOCS_URL =
  "https://github.com/discord/discord-api-docs/pull/8606";
