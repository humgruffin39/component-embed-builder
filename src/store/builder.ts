"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { ComponentType } from "@/lib/constants";
import {
  type ContainerNode,
  type NodeId,
  createButton,
  createContainer,
  createGalleryItem,
  createSeparator,
  createTextDisplay,
  createThumbnail,
  resetIds,
} from "@/lib/document";
import {
  type InsertableType,
  type TreeNode,
  ancestorsOf,
  createContainerChild,
  findNode,
  findOwner,
  findParent,
  hasEmptyRequiredSlot,
  isComponentNode,
  moveWithin,
  slotAccepts,
  slotsFor,
} from "@/lib/tree";

export type PreviewTheme = "light" | "dark";
export type PreviewWidth = "desktop" | "mobile";
export type AccessoryKind = "thumbnail" | "button";
export type SectionAddition = "text" | AccessoryKind;

/**
 * Undo history. A snapshot is just the previous `root` object, so immer's
 * structural sharing makes them nearly free.
 *
 * It lives in the store, not in module scope, so replacing the document can
 * clear it. Otherwise undo walks back into a document the user has left.
 */
const HISTORY_LIMIT = 100;
const COALESCE_MS = 600;

interface History {
  past: ContainerNode[];
  future: ContainerNode[];
  /** Which field the last edit touched, for collapsing a run of keystrokes. */
  lastKey: string | null;
  lastAt: number;
}

const emptyHistory = (): History => ({
  past: [],
  future: [],
  lastKey: null,
  lastAt: 0,
});

/**
 * Records the state before a change. Repeated edits to the same field within
 * a short window collapse into one entry, so undo steps back a word at a time
 * rather than a keystroke at a time.
 */
const record = (history: History, root: ContainerNode, key?: string) => {
  const now = Date.now();
  const coalesce =
    key != null && key === history.lastKey && now - history.lastAt < COALESCE_MS;
  history.lastKey = key ?? null;
  history.lastAt = now;
  if (coalesce) return;

  history.past.push(root);
  if (history.past.length > HISTORY_LIMIT) history.past.shift();
  history.future = [];
};

interface BuilderState {
  root: ContainerNode;
  /** Not rendered; kept here so it can be reset with the document. */
  history: History;
  selectedId: NodeId | null;
  /** Ids of group rows the user has folded shut in the tree. */
  collapsed: Record<NodeId, boolean>;
  previewTheme: PreviewTheme;
  previewWidth: PreviewWidth;

  select: (id: NodeId | null) => void;
  toggleCollapsed: (id: NodeId) => void;
  setPreviewTheme: (theme: PreviewTheme) => void;
  setPreviewWidth: (width: PreviewWidth) => void;

  addComponent: (type: InsertableType, index?: number) => void;
  removeNode: (id: NodeId) => void;
  moveNode: (activeId: NodeId, overId: NodeId) => void;
  updateNode: (id: NodeId, patch: Record<string, unknown>) => void;

  addToSection: (sectionId: NodeId, addition: SectionAddition) => void;
  addGalleryItem: (galleryId: NodeId) => void;
  addButton: (rowId: NodeId) => void;

  replaceDocument: (root: ContainerNode) => void;

  undo: () => void;
  redo: () => void;
}

/** Valid on load, and says enough that nobody has to guess what this is. */
const defaultRoot = (): ContainerNode => {
  resetIds();
  return createContainer([
    createTextDisplay(
      "# Your headline\nThe line underneath it. **Bold**, *italic*, [links](https://discord.com) and lists all work.",
    ),
    createSeparator(),
    createTextDisplay(
      "- Click any part of the preview to edit it\n- Use + to add a component\n- Saved in the URL. Copy the link to keep it.",
    ),
  ]);
};

const initial = { root: defaultRoot() };

/** Puts a snapshot back, keeping the selection only if it still exists. */
const restore = (state: BuilderState, root: ContainerNode) => {
  state.root = root;
  if (!state.selectedId || !findNode(state.root, state.selectedId)) {
    state.selectedId = state.root.id;
  }
};

/** Drops fold state for rows that no longer exist, so the map cannot grow forever. */
const pruneCollapsed = (state: BuilderState) => {
  for (const id of Object.keys(state.collapsed)) {
    if (!findNode(state.root, id)) delete state.collapsed[id];
  }
};

/** Selects the node that takes the place of a removed one. */
const neighbourOf = (list: TreeNode[], index: number): NodeId | null =>
  list[index]?.id ?? list[index - 1]?.id ?? null;

export const useBuilder = create<BuilderState>()(
  immer((set, get) => ({
    ...initial,
    history: emptyHistory(),
    selectedId: initial.root.id,
    collapsed: {},
    previewTheme: "dark",
    previewWidth: "desktop",

    select: (id) =>
      set((state) => {
        state.selectedId = id;
        // Selecting from the preview has to reveal the row, not leave it folded
        // away inside a collapsed group.
        if (id) {
          for (const ancestor of ancestorsOf(state.root, id)) {
            delete state.collapsed[ancestor.id];
          }
        }
      }),

    toggleCollapsed: (id) =>
      set((state) => {
        state.collapsed[id] = !state.collapsed[id];
      }),

    setPreviewTheme: (theme) =>
      set((state) => {
        state.previewTheme = theme;
      }),

    setPreviewWidth: (width) =>
      set((state) => {
        state.previewWidth = width;
      }),

    addComponent: (type, index) =>
      set((state) => {
        record(state.history, get().root);
        const node = createContainerChild(type);
        const at = index ?? state.root.components.length;
        state.root.components.splice(at, 0, node);
        state.selectedId = node.id;
      }),

    removeNode: (id) =>
      set((state) => {
        if (!findOwner(state.root, id)) return;
        record(state.history, get().root);

        // Taking the last child out of a section, gallery or action row would
        // leave a shape Discord rejects, so the parent goes with it.
        let target: NodeId = id;
        let owner = findOwner(state.root, target)!;
        for (;;) {
          const parent = findParent(state.root, target);
          owner = findOwner(state.root, target)!;
          owner.list.splice(owner.index, 1);
          if (parent && hasEmptyRequiredSlot(parent)) {
            target = parent.id;
            continue;
          }
          break;
        }

        if (!state.selectedId || !findNode(state.root, state.selectedId)) {
          state.selectedId = neighbourOf(owner.list, owner.index) ?? state.root.id;
        }
        pruneCollapsed(state);
      }),

    moveNode: (activeId, overId) =>
      set((state) => {
        const from = findOwner(state.root, activeId);
        if (!from) return;
        const node = from.list[from.index];

        // The row dropped on is usually a sibling, but it can also be the
        // group itself, which means "put it inside".
        const over = findNode(state.root, overId);
        const to =
          over && slotAccepts(over, slotsFor(over), node)
            ? { parent: over, list: slotsFor(over), index: slotsFor(over).length }
            : findOwner(state.root, overId);
        if (!to || !slotAccepts(to.parent, to.list, node)) return;
        if (from.list === to.list && from.index === to.index) return;

        record(state.history, get().root);
        if (from.list === to.list) {
          moveWithin(from.list, from.index, to.index);
        } else {
          from.list.splice(from.index, 1);
          to.list.splice(to.index, 0, node);
          if (hasEmptyRequiredSlot(from.parent)) {
            const orphan = findOwner(state.root, from.parent.id);
            if (orphan) orphan.list.splice(orphan.index, 1);
          }
        }
      }),

    updateNode: (id, patch) =>
      set((state) => {
        const node = findNode(state.root, id);
        if (!node) return;
        record(state.history, get().root, `${id}:${Object.keys(patch).join(",")}`);
        Object.assign(node, patch);
      }),

    addToSection: (sectionId, addition) =>
      set((state) => {
        const node = findNode(state.root, sectionId);
        if (
          !node ||
          !isComponentNode(node) ||
          node.type !== ComponentType.Section
        ) {
          return;
        }
        record(state.history, get().root);
        if (addition === "text") {
          const text = createTextDisplay();
          node.components.push(text);
          state.selectedId = text.id;
          return;
        }
        // A section always carries exactly one accessory, so this replaces it.
        node.accessory =
          addition === "thumbnail" ? createThumbnail() : createButton();
        state.selectedId = node.accessory.id;
      }),

    addGalleryItem: (galleryId) =>
      set((state) => {
        const node = findNode(state.root, galleryId);
        if (
          !node ||
          !isComponentNode(node) ||
          node.type !== ComponentType.MediaGallery
        ) {
          return;
        }
        record(state.history, get().root);
        const item = createGalleryItem();
        node.items.push(item);
        state.selectedId = item.id;
      }),

    addButton: (rowId) =>
      set((state) => {
        const node = findNode(state.root, rowId);
        if (
          !node ||
          !isComponentNode(node) ||
          node.type !== ComponentType.ActionRow
        ) {
          return;
        }
        record(state.history, get().root);
        const button = createButton();
        node.components.push(button);
        state.selectedId = button.id;
      }),

    replaceDocument: (root) =>
      set((state) => {
        // A different document entirely, so the old history no longer applies.
        state.history = emptyHistory();
        state.root = root;
        state.selectedId = root.id;
        state.collapsed = {};
      }),

    undo: () =>
      set((state) => {
        const previous = state.history.past.pop();
        if (!previous) return;
        state.history.future.push(get().root);
        state.history.lastKey = null;
        restore(state, previous);
      }),

    redo: () =>
      set((state) => {
        const next = state.history.future.pop();
        if (!next) return;
        state.history.past.push(get().root);
        state.history.lastKey = null;
        restore(state, next);
      }),
  })),
);
