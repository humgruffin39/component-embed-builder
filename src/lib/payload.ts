import type { ComponentType } from "@/lib/constants";

/** The wire format Discord reads. Mirrors the Compatible Components table. */

export interface UnfurledMedia {
  url: string;
}

export interface ButtonComponent {
  type: typeof ComponentType.Button;
  style: 5;
  url: string;
  label?: string;
  emoji?: { name: string };
}

export interface TextDisplayComponent {
  type: typeof ComponentType.TextDisplay;
  content: string;
}

export interface ThumbnailComponent {
  type: typeof ComponentType.Thumbnail;
  media: UnfurledMedia;
  description?: string;
  spoiler?: boolean;
}

export interface MediaGalleryItem {
  media: UnfurledMedia;
  description?: string;
  spoiler?: boolean;
}

export interface MediaGalleryComponent {
  type: typeof ComponentType.MediaGallery;
  items: MediaGalleryItem[];
}

export interface SectionComponent {
  type: typeof ComponentType.Section;
  components: TextDisplayComponent[];
  accessory: ThumbnailComponent | ButtonComponent;
}

export interface SeparatorComponent {
  type: typeof ComponentType.Separator;
  divider?: boolean;
  spacing?: 1 | 2;
}

export interface ActionRowComponent {
  type: typeof ComponentType.ActionRow;
  components: ButtonComponent[];
}

export type ContainerChild =
  | TextDisplayComponent
  | SectionComponent
  | MediaGalleryComponent
  | SeparatorComponent
  | ActionRowComponent;

export interface ContainerComponent {
  type: typeof ComponentType.Container;
  accent_color?: number | null;
  spoiler?: boolean;
  components: ContainerChild[];
}

export interface ComponentEmbedPayload {
  component: ContainerComponent;
}

export type AnyComponent =
  | ContainerComponent
  | ContainerChild
  | ThumbnailComponent
  | ButtonComponent;
