import { ComponentType, LIMITS, NODE_LABELS } from "@/lib/constants";
import { ROOT_PATH, childPath } from "@/lib/path";
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

/** The one reorderable list a node owns, or an empty array for a leaf. */
export const slotsFor = (node: TreeNode): TreeNode[] => slotsOf(node)[0] ?? [];

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

export interface Owner {
  /** The node that owns the slot, needed to decide what the slot will take. */
  parent: TreeNode;
  list: TreeNode[];
  index: number;
}

/** Locates the array a node lives in, so it can be moved or removed. */
export const findOwner = (root: ContainerNode, id: NodeId): Owner | null => {
  let owner: Owner | null = null;
  walk(root, (node) => {
    if (owner) return;
    for (const list of slotsOf(node)) {
      const index = list.findIndex((child) => child.id === id);
      if (index !== -1) owner = { parent: node, list, index };
    }
  });
  return owner;
};

/** How many a slot will hold, so a drag cannot overfill one. */
const slotCapacity = (parent: TreeNode): number => {
  if (!isComponentNode(parent)) return 0;
  switch (parent.type) {
    case ComponentType.Container:
      return LIMITS.components;
    case ComponentType.Section:
      return LIMITS.sectionTextMax;
    case ComponentType.ActionRow:
      return LIMITS.actionRowButtons;
    case ComponentType.MediaGallery:
      return LIMITS.galleryItemsMax;
    default:
      return 0;
  }
};

/**
 * Whether a slot will take this node. Each parent holds exactly one kind of
 * child, so a drag into the wrong place is refused rather than silently
 * producing a payload Discord rejects.
 */
export const slotAccepts = (
  parent: TreeNode,
  list: TreeNode[],
  node: TreeNode,
): boolean => {
  if (!isComponentNode(parent)) return false;
  const galleryItem = !isComponentNode(node);
  if (!list.includes(node) && list.length >= slotCapacity(parent)) return false;

  switch (parent.type) {
    case ComponentType.Container:
      return (
        !galleryItem &&
        (INSERTABLE_TYPES as readonly number[]).includes(node.type)
      );
    case ComponentType.Section:
      return !galleryItem && node.type === ComponentType.TextDisplay;
    case ComponentType.ActionRow:
      return !galleryItem && node.type === ComponentType.Button;
    case ComponentType.MediaGallery:
      return galleryItem;
    default:
      return false;
  }
};

export const moveWithin = <T>(list: T[], from: number, to: number): void => {
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
};

export const isSection = (node: TreeNode): node is SectionNode =>
  isComponentNode(node) && node.type === ComponentType.Section;


/**
 * Walks the tree the way the renderer does, pairing each node with the
 * structural path the preview labels it with. The order of the slots matters:
 * it has to match `toPayload` exactly, or the two address spaces drift.
 */
const eachWithPath = (
  node: TreeNode,
  path: string,
  visit: (node: TreeNode, path: string) => void,
): void => {
  visit(node, path);
  if (!isComponentNode(node)) return;

  switch (node.type) {
    case ComponentType.Container:
    case ComponentType.ActionRow:
      node.components.forEach((child, index) =>
        eachWithPath(child, childPath(path, "components", index), visit),
      );
      break;
    case ComponentType.Section:
      node.components.forEach((child, index) =>
        eachWithPath(child, childPath(path, "components", index), visit),
      );
      eachWithPath(node.accessory, childPath(path, "accessory"), visit);
      break;
    case ComponentType.MediaGallery:
      node.items.forEach((item, index) =>
        eachWithPath(item, childPath(path, "items", index), visit),
      );
      break;
  }
};

/** The node the preview rendered at this path, for turning a click into a selection. */
export const nodeAtPath = (
  root: ContainerNode,
  path: string,
): TreeNode | null => {
  let found: TreeNode | null = null;
  eachWithPath(root, ROOT_PATH, (node, nodePath) => {
    if (nodePath === path) found = node;
  });
  return found;
};

/** The path the preview renders a node at, for drawing the selection outline. */
export const pathOfNode = (root: ContainerNode, id: NodeId): string | null => {
  let found: string | null = null;
  eachWithPath(root, ROOT_PATH, (node, nodePath) => {
    if (node.id === id) found = nodePath;
  });
  return found;
};

/**
 * Slots that cannot be left empty: Discord rejects a section with no text, a
 * gallery with no items and an action row with no buttons, so emptying one of
 * these takes the parent with it.
 */
export const hasEmptyRequiredSlot = (node: TreeNode): boolean => {
  if (!isComponentNode(node)) return false;
  switch (node.type) {
    case ComponentType.Section:
    case ComponentType.ActionRow:
      return node.components.length === 0;
    case ComponentType.MediaGallery:
      return node.items.length === 0;
    default:
      return false;
  }
};

/** Every ancestor of a node, innermost first. */
export const ancestorsOf = (root: ContainerNode, id: NodeId): TreeNode[] => {
  const chain: TreeNode[] = [];
  let current = findParent(root, id);
  while (current) {
    chain.push(current);
    current = findParent(root, current.id);
  }
  return chain;
};

/**
 * Which top-level slot a drop lands in. Dropping on anything nested counts as
 * dropping on the top-level component it sits inside, and an id that belongs
 * to no row at all, such as the space below the last one, means the end.
 */
export const topLevelIndexOf = (root: ContainerNode, overId: NodeId): number => {
  const index = root.components.findIndex((child) => child.id === overId);
  if (index !== -1) return index;
  for (const ancestor of ancestorsOf(root, overId)) {
    const nested = root.components.findIndex((child) => child.id === ancestor.id);
    if (nested !== -1) return nested;
  }
  return root.components.length;
};

/**
 * The rows the tree shows, top to bottom, skipping anything folded away.
 * Arrow keys walk this list, so it has to match what is on screen.
 */
export const visibleRows = (
  root: ContainerNode,
  collapsed: Record<NodeId, boolean>,
): { id: NodeId; parentId: NodeId | null; group: boolean }[] => {
  const rows: { id: NodeId; parentId: NodeId | null; group: boolean }[] = [];

  const isGroup = (node: TreeNode) =>
    isComponentNode(node) &&
    (node.type === ComponentType.Section ||
      node.type === ComponentType.MediaGallery ||
      node.type === ComponentType.ActionRow);

  const step = (node: TreeNode, parentId: NodeId | null) => {
    rows.push({ id: node.id, parentId, group: isGroup(node) });
    if (isGroup(node) && collapsed[node.id]) return;
    for (const child of slotsFor(node)) step(child, node.id);
    if (isSection(node)) rows.push({ id: node.accessory.id, parentId: node.id, group: false });
  };

  rows.push({ id: root.id, parentId: null, group: false });
  for (const child of root.components) step(child, root.id);
  return rows;
};

/**
 * Where an addition would land, given what is selected. Selecting a gallery
 * item means the gallery, a button means its row, a section's text means the
 * section; anything else means the container. The palette names this, so the
 * destination is never a guess.
 */
export const destinationFor = (
  root: ContainerNode,
  selectedId: NodeId | null,
): ContainerNode | SectionNode | MediaGalleryNode | ActionRowNode => {
  if (!selectedId) return root;

  const chain = [
    findNode(root, selectedId),
    ...ancestorsOf(root, selectedId),
  ].filter((node): node is TreeNode => node !== null);

  for (const node of chain) {
    if (!isComponentNode(node)) continue;
    if (
      node.type === ComponentType.Section ||
      node.type === ComponentType.MediaGallery ||
      node.type === ComponentType.ActionRow
    ) {
      return node;
    }
  }
  return root;
};

/**
 * What to call the selected node on screen. Gallery items carry no component
 * type, so they are numbered by their place in the gallery instead.
 */
export const labelForNode = (
  root: ContainerNode,
  selectedId: NodeId | null,
): string => {
  const node = findNode(root, selectedId ?? root.id) ?? root;
  if (isComponentNode(node)) return NODE_LABELS[node.type];

  const parent = findParent(root, node.id);
  const index =
    parent && isComponentNode(parent) && parent.type === ComponentType.MediaGallery
      ? parent.items.findIndex((item) => item.id === node.id) + 1
      : 0;
  return `Item ${index}`;
};
