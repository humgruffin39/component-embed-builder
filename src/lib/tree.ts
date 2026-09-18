import { ComponentType } from "@/lib/constants";
import {
  type ActionRowNode,
  type ContainerChildNode,
  type ContainerNode,
  type EditorNode,
  type GalleryItemNode,
  type MediaGalleryNode,
  type NodeId,
  type SectionNode,
  createActionRow,
  createMediaGallery,
  createSection,
  createSeparator,
  createTextDisplay,
} from "@/lib/document";

/** Anything addressable in the tree: components plus media gallery items. */
export type TreeNode = EditorNode | GalleryItemNode;

/** Media gallery items are the only tree nodes without a component type. */
export const isComponentNode = (node: TreeNode): node is EditorNode =>
  "type" in node;

/** Component types a user can insert directly into the container. */
export const INSERTABLE_TYPES = [
  ComponentType.TextDisplay,
  ComponentType.Section,
  ComponentType.MediaGallery,
  ComponentType.Separator,
  ComponentType.ActionRow,
] as const;

export type InsertableType = (typeof INSERTABLE_TYPES)[number];

export const createContainerChild = (
  type: InsertableType,
): ContainerChildNode => {
  switch (type) {
    case ComponentType.TextDisplay:
      return createTextDisplay();
    case ComponentType.Section:
      return createSection();
    case ComponentType.MediaGallery:
      return createMediaGallery();
    case ComponentType.Separator:
      return createSeparator();
    case ComponentType.ActionRow:
      return createActionRow();
  }
};

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

/** The reorderable child arrays a node owns, in tree order. */
const slotsOf = (node: TreeNode): TreeNode[][] => {
  if (!isComponentNode(node)) return [];
  switch (node.type) {
    case ComponentType.Container:
    case ComponentType.Section:
    case ComponentType.ActionRow:
      return [node.components];
    case ComponentType.MediaGallery:
      return [node.items];
    default:
      return [];
  }
};

const childrenOf = (node: TreeNode): TreeNode[] => {
  const children = slotsOf(node).flat();
  return isComponentNode(node) && node.type === ComponentType.Section
    ? [...children, node.accessory]
    : children;
};

/** Depth-first walk over the whole tree, root included. */
export const walk = (
  root: ContainerNode,
  visit: (node: TreeNode, parent: TreeNode | null) => void,
): void => {
  const step = (node: TreeNode, parent: TreeNode | null) => {
    visit(node, parent);
    for (const child of childrenOf(node)) step(child, node);
  };
  step(root, null);
};

/** Gallery items are payload data, not components, so they do not count. */
export const countComponents = (root: ContainerNode): number => {
  let total = 0;
  walk(root, (node) => {
    if (isComponentNode(node)) total += 1;
  });
  return total;
};

export const findNode = (root: ContainerNode, id: NodeId): TreeNode | null => {
  let found: TreeNode | null = null;
  walk(root, (node) => {
    if (node.id === id) found = node;
  });
  return found;
};

export const findParent = (root: ContainerNode, id: NodeId): TreeNode | null => {
  let found: TreeNode | null = null;
  walk(root, (node, parent) => {
    if (node.id === id) found = parent;
  });
  return found;
};

interface Owner {
  list: TreeNode[];
  index: number;
}

/** Locates the array a node lives in, so it can be moved, cloned or removed. */
export const findOwner = (root: ContainerNode, id: NodeId): Owner | null => {
  let owner: Owner | null = null;
  walk(root, (node) => {
    for (const list of slotsOf(node)) {
      const index = list.findIndex((child) => child.id === id);
      if (index !== -1) owner = { list, index };
    }
  });
  return owner;
};

export const moveWithin = <T>(list: T[], from: number, to: number): void => {
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
};

export const isSection = (node: TreeNode): node is SectionNode =>
  isComponentNode(node) && node.type === ComponentType.Section;

export const isActionRow = (node: TreeNode): node is ActionRowNode =>
  isComponentNode(node) && node.type === ComponentType.ActionRow;

export const isMediaGallery = (node: TreeNode): node is MediaGalleryNode =>
  isComponentNode(node) && node.type === ComponentType.MediaGallery;
