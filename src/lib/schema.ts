import { z } from "zod";
import { ComponentType, LIMITS, LINK_BUTTON_STYLE } from "@/lib/constants";
import type { ComponentEmbedPayload } from "@/lib/payload";

/**
 * Runtime shape of the wire format, used when parsing payloads we did not
 * produce (imports and pasted JSON). Objects are strict: Discord rejects the
 * whole payload when it meets a key it does not expect.
 */

const mediaSchema = z.strictObject({
  url: z.string().max(LIMITS.mediaUrl),
});

const mediaFieldsSchema = {
  description: z.string().max(LIMITS.mediaDescription).nullish(),
  spoiler: z.boolean().optional(),
};

const buttonSchema = z.strictObject({
  type: z.literal(ComponentType.Button),
  style: z.literal(LINK_BUTTON_STYLE),
  url: z.string().max(LIMITS.buttonUrl),
  label: z.string().max(LIMITS.buttonLabel).optional(),
  emoji: z.looseObject({ name: z.string().optional() }).optional(),
  disabled: z.boolean().optional(),
});

const textDisplaySchema = z.strictObject({
  type: z.literal(ComponentType.TextDisplay),
  id: z.number().optional(),
  content: z.string(),
});

const thumbnailSchema = z.strictObject({
  type: z.literal(ComponentType.Thumbnail),
  id: z.number().optional(),
  media: mediaSchema,
  ...mediaFieldsSchema,
});

const sectionSchema = z.strictObject({
  type: z.literal(ComponentType.Section),
  id: z.number().optional(),
  components: z
    .array(textDisplaySchema)
    .min(LIMITS.sectionTextMin)
    .max(LIMITS.sectionTextMax),
  accessory: z.union([thumbnailSchema, buttonSchema]),
});

const mediaGallerySchema = z.strictObject({
  type: z.literal(ComponentType.MediaGallery),
  id: z.number().optional(),
  items: z
    .array(z.strictObject({ media: mediaSchema, ...mediaFieldsSchema }))
    .min(LIMITS.galleryItemsMin)
    .max(LIMITS.galleryItemsMax),
});

const separatorSchema = z.strictObject({
  type: z.literal(ComponentType.Separator),
  id: z.number().optional(),
  divider: z.boolean().optional(),
  spacing: z.union([z.literal(1), z.literal(2)]).optional(),
});

const actionRowSchema = z.strictObject({
  type: z.literal(ComponentType.ActionRow),
  id: z.number().optional(),
  components: z.array(buttonSchema).min(1).max(LIMITS.actionRowButtons),
});

const containerChildSchema = z.discriminatedUnion("type", [
  textDisplaySchema,
  sectionSchema,
  mediaGallerySchema,
  separatorSchema,
  actionRowSchema,
]);

export const containerSchema = z.strictObject({
  type: z.literal(ComponentType.Container),
  id: z.number().optional(),
  accent_color: z.number().int().min(0).max(LIMITS.accentColorMax).nullish(),
  spoiler: z.boolean().optional(),
  components: z.array(containerChildSchema),
});

export const payloadSchema = z.strictObject({
  component: containerSchema,
});

export const parsePayload = (
  value: unknown,
): { ok: true; payload: ComponentEmbedPayload } | { ok: false; error: string } => {
  const result = payloadSchema.safeParse(value);
  if (result.success) {
    return { ok: true, payload: result.data as ComponentEmbedPayload };
  }
  const [issue] = result.error.issues;
  const path = issue.path.join(".");
  return {
    ok: false,
    error: path ? `${path}: ${issue.message}` : issue.message,
  };
};
