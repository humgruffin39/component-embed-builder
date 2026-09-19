import { ComponentType, LINK_BUTTON_STYLE } from "@/lib/constants";
import type {
  ActionRowComponent,
  ButtonComponent,
  ComponentEmbedPayload,
  ContainerChild,
  ContainerComponent,
  MediaGalleryComponent,
  SectionComponent,
  SeparatorComponent,
  TextDisplayComponent,
  ThumbnailComponent,
} from "@/lib/payload";

/**
 * The editor model mirrors the wire format but gives every node a stable id so
 * the tree can be selected and reordered. Ids never reach the payload.
 */

export type NodeId = string;

let sequence = 0;
export const nextId = (): NodeId => `n${++sequence}`;

/**
 * Starts the numbering over.
 *
 * The counter is module state, so whoever builds nodes first decides where a
 * later document starts. On the server the page's own embed is built before
 * the store builds its first document. On the client that embed is never built
 * at all. Without a reset the two sides disagree, and hydration fails.
 */
export const resetIds = (): void => {
  sequence = 0;
};

interface NodeBase {
  id: NodeId;
}

export interface TextDisplayNode extends NodeBase {
  type: typeof ComponentType.TextDisplay;
  content: string;
}

export interface ButtonNode extends NodeBase {
  type: typeof ComponentType.Button;
  label: string;
  url: string;
  emoji: string;
}

export interface ThumbnailNode extends NodeBase {
  type: typeof ComponentType.Thumbnail;
  url: string;
  description: string;
  spoiler: boolean;
}

export interface GalleryItemNode extends NodeBase {
  url: string;
  description: string;
  spoiler: boolean;
}

export interface MediaGalleryNode extends NodeBase {
  type: typeof ComponentType.MediaGallery;
  items: GalleryItemNode[];
}

export interface SectionNode extends NodeBase {
  type: typeof ComponentType.Section;
  components: TextDisplayNode[];
  accessory: ThumbnailNode | ButtonNode;
}

export interface SeparatorNode extends NodeBase {
  type: typeof ComponentType.Separator;
  divider: boolean;
  spacing: 1 | 2;
}

export interface ActionRowNode extends NodeBase {
  type: typeof ComponentType.ActionRow;
  components: ButtonNode[];
}

export interface ContainerNode extends NodeBase {
  type: typeof ComponentType.Container;
  accentColor: number | null;
  spoiler: boolean;
  components: ContainerChildNode[];
}

export type ContainerChildNode =
  | TextDisplayNode
  | SectionNode
  | MediaGalleryNode
  | SeparatorNode
  | ActionRowNode;

export type EditorNode =
  | ContainerNode
  | ContainerChildNode
  | ThumbnailNode
  | ButtonNode;

/* -------------------------------------------------------------------------- */
/* Factories                                                                  */
/* -------------------------------------------------------------------------- */

export const createTextDisplay = (content = "New text"): TextDisplayNode => ({
  id: nextId(),
  type: ComponentType.TextDisplay,
  content,
});

export const createButton = (): ButtonNode => ({
  id: nextId(),
  type: ComponentType.Button,
  label: "Open",
  url: "",
  emoji: "",
});

export const createThumbnail = (): ThumbnailNode => ({
  id: nextId(),
  type: ComponentType.Thumbnail,
  url: "",
  description: "",
  spoiler: false,
});

export const createGalleryItem = (url = ""): GalleryItemNode => ({
  id: nextId(),
  url,
  description: "",
  spoiler: false,
});

export const createMediaGallery = (): MediaGalleryNode => ({
  id: nextId(),
  type: ComponentType.MediaGallery,
  items: [createGalleryItem()],
});

export const createSection = (): SectionNode => ({
  id: nextId(),
  type: ComponentType.Section,
  components: [createTextDisplay("## Heading\nSupporting line.")],
  accessory: createThumbnail(),
});

export const createSeparator = (): SeparatorNode => ({
  id: nextId(),
  type: ComponentType.Separator,
  divider: true,
  spacing: 1,
});

export const createActionRow = (): ActionRowNode => ({
  id: nextId(),
  type: ComponentType.ActionRow,
  components: [createButton()],
});

export const createContainer = (
  components: ContainerChildNode[] = [],
): ContainerNode => ({
  id: nextId(),
  type: ComponentType.Container,
  accentColor: 0x5865f2,
  spoiler: false,
  components,
});

/* -------------------------------------------------------------------------- */
/* Editor model to wire format                                                */
/* -------------------------------------------------------------------------- */

const trimmed = (value: string): string | undefined => {
  const next = value.trim();
  return next.length > 0 ? next : undefined;
};

const toButton = (node: ButtonNode): ButtonComponent => {
  const label = trimmed(node.label);
  const emoji = trimmed(node.emoji);
  return {
    type: ComponentType.Button,
    style: LINK_BUTTON_STYLE,
    url: node.url.trim(),
    ...(label ? { label } : {}),
    ...(emoji ? { emoji: { name: emoji } } : {}),
  };
};

const toThumbnail = (node: ThumbnailNode): ThumbnailComponent => {
  const description = trimmed(node.description);
  return {
    type: ComponentType.Thumbnail,
    media: { url: node.url.trim() },
    ...(description ? { description } : {}),
    ...(node.spoiler ? { spoiler: true } : {}),
  };
};

const toTextDisplay = (node: TextDisplayNode): TextDisplayComponent => ({
  type: ComponentType.TextDisplay,
  content: node.content,
});

const toSection = (node: SectionNode): SectionComponent => ({
  type: ComponentType.Section,
  components: node.components.map(toTextDisplay),
  accessory:
    node.accessory.type === ComponentType.Thumbnail
      ? toThumbnail(node.accessory)
      : toButton(node.accessory),
});

const toMediaGallery = (node: MediaGalleryNode): MediaGalleryComponent => ({
  type: ComponentType.MediaGallery,
  items: node.items.map((item) => {
    const description = trimmed(item.description);
    return {
      media: { url: item.url.trim() },
      ...(description ? { description } : {}),
      ...(item.spoiler ? { spoiler: true } : {}),
    };
  }),
});

const toSeparator = (node: SeparatorNode): SeparatorComponent => ({
  type: ComponentType.Separator,
  ...(node.divider ? {} : { divider: false }),
  spacing: node.spacing,
});

const toActionRow = (node: ActionRowNode): ActionRowComponent => ({
  type: ComponentType.ActionRow,
  components: node.components.map(toButton),
});

const toContainerChild = (node: ContainerChildNode): ContainerChild => {
  switch (node.type) {
    case ComponentType.TextDisplay:
      return toTextDisplay(node);
    case ComponentType.Section:
      return toSection(node);
    case ComponentType.MediaGallery:
      return toMediaGallery(node);
    case ComponentType.Separator:
      return toSeparator(node);
    case ComponentType.ActionRow:
      return toActionRow(node);
  }
};

export const toContainer = (node: ContainerNode): ContainerComponent => ({
  type: ComponentType.Container,
  ...(node.accentColor === null ? {} : { accent_color: node.accentColor }),
  ...(node.spoiler ? { spoiler: true } : {}),
  components: node.components.map(toContainerChild),
});

export const toPayload = (root: ContainerNode): ComponentEmbedPayload => ({
  component: toContainer(root),
});

/* -------------------------------------------------------------------------- */
/* Wire format to editor model                                                */
/* -------------------------------------------------------------------------- */

const fromButton = (component: ButtonComponent): ButtonNode => ({
  id: nextId(),
  type: ComponentType.Button,
  label: component.label ?? "",
  url: component.url ?? "",
  emoji: component.emoji?.name ?? "",
});

const fromThumbnail = (component: ThumbnailComponent): ThumbnailNode => ({
  id: nextId(),
  type: ComponentType.Thumbnail,
  url: component.media?.url ?? "",
  description: component.description ?? "",
  spoiler: component.spoiler ?? false,
});

const fromTextDisplay = (component: TextDisplayComponent): TextDisplayNode => ({
  id: nextId(),
  type: ComponentType.TextDisplay,
  content: component.content ?? "",
});

const fromContainerChild = (component: ContainerChild): ContainerChildNode => {
  switch (component.type) {
    case ComponentType.TextDisplay:
      return fromTextDisplay(component);
    case ComponentType.Section:
      return {
        id: nextId(),
        type: ComponentType.Section,
        components: component.components.map(fromTextDisplay),
        accessory:
          component.accessory.type === ComponentType.Thumbnail
            ? fromThumbnail(component.accessory)
            : fromButton(component.accessory),
      };
    case ComponentType.MediaGallery:
      return {
        id: nextId(),
        type: ComponentType.MediaGallery,
        items: component.items.map((item) => ({
          id: nextId(),
          url: item.media?.url ?? "",
          description: item.description ?? "",
          spoiler: item.spoiler ?? false,
        })),
      };
    case ComponentType.Separator:
      return {
        id: nextId(),
        type: ComponentType.Separator,
        divider: component.divider ?? true,
        spacing: component.spacing ?? 1,
      };
    case ComponentType.ActionRow:
      return {
        id: nextId(),
        type: ComponentType.ActionRow,
        components: component.components.map(fromButton),
      };
  }
};

export const fromContainer = (component: ContainerComponent): ContainerNode => ({
  id: nextId(),
  type: ComponentType.Container,
  accentColor: component.accent_color ?? null,
  spoiler: component.spoiler ?? false,
  components: component.components.map(fromContainerChild),
});

export const fromPayload = (payload: ComponentEmbedPayload): ContainerNode =>
  fromContainer(payload.component);
