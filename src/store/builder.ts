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
} from "@/lib/document";
import {
  type InsertableType,
  type TreeNode,
  createContainerChild,
  findNode,
  findOwner,
  isComponentNode,
  moveWithin,
} from "@/lib/tree";

export type PreviewTheme = "light" | "dark";
export type PreviewWidth = "desktop" | "mobile";
export type AccessoryKind = "thumbnail" | "button";
export type SectionAddition = "text" | AccessoryKind;

/**
 * Undo history. It lives outside the store because a snapshot is just the
 * previous `root` object: immer already gives us structural sharing, so
 * keeping them costs almost nothing and never needs to be rendered.
 */
const HISTORY_LIMIT = 100;

const past: ContainerNode[] = [];
let future: ContainerNode[] = [];
let lastKey: string | null = null;
let lastAt = 0;

/**
 * Records the state before a change. Repeated edits to the same field within
 * a short window collapse into one entry, so undo steps back a word at a time
 * rather than a keystroke at a time.
 */
const record = (root: ContainerNode, key?: string) => {
  const now = Date.now();
  const coalesce = key != null && key === lastKey && now - lastAt < 600;
  lastKey = key ?? null;
  lastAt = now;
  if (coalesce) return;

  past.push(root);
  if (past.length > HISTORY_LIMIT) past.shift();
  future = [];
};

interface BuilderState {
  root: ContainerNode;
  selectedId: NodeId | null;
  /** Ids of group rows the user has folded shut in the tree. */
  collapsed: Record<NodeId, boolean>;
  previewTheme: PreviewTheme;
  previewWidth: PreviewWidth;

  select: (id: NodeId | null) => void;
  toggleCollapsed: (id: NodeId) => void;
  setPreviewTheme: (theme: PreviewTheme) => void;
  setPreviewWidth: (width: PreviewWidth) => void;

  addComponent: (type: InsertableType) => void;
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

/** Valid on load, so the first thing a user sees is working output. */
const defaultRoot = (): ContainerNode =>
  createContainer([
    createTextDisplay(
      "# Your page title\nThe line that sits under it, with **markdown**.",
    ),
    createSeparator(),
    createTextDisplay(
      "-# Add a section, a gallery or link buttons from the panel on the left.",
    ),
  ]);

const initial = { root: defaultRoot() };

/** Puts a snapshot back, keeping the selection only if it still exists. */
const restore = (state: BuilderState, root: ContainerNode) => {
  state.root = root;
  if (!state.selectedId || !findNode(state.root, state.selectedId)) {
    state.selectedId = state.root.id;
  }
};

/** Selects the node that takes the place of a removed one. */
const neighbourOf = (list: TreeNode[], index: number): NodeId | null =>
  list[index]?.id ?? list[index - 1]?.id ?? null;

export const useBuilder = create<BuilderState>()(
  immer((set, get) => ({
    ...initial,
    selectedId: initial.root.id,
    collapsed: {},
    previewTheme: "dark",
    previewWidth: "desktop",

    select: (id) =>
      set((state) => {
        state.selectedId = id;
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

    addComponent: (type) =>
      set((state) => {
        record(get().root);
        const node = createContainerChild(type);
        state.root.components.push(node);
        state.selectedId = node.id;
      }),

    removeNode: (id) =>
      set((state) => {
        record(get().root);
        const owner = findOwner(state.root, id);
        if (!owner) return;
        owner.list.splice(owner.index, 1);
        if (state.selectedId === id) {
          state.selectedId = neighbourOf(owner.list, owner.index) ?? state.root.id;
        }
      }),

    moveNode: (activeId, overId) =>
      set((state) => {
        record(get().root);
        const from = findOwner(state.root, activeId);
        const to = findOwner(state.root, overId);
        if (!from || !to || from.list !== to.list) return;
        moveWithin(from.list, from.index, to.index);
      }),

    updateNode: (id, patch) =>
      set((state) => {
        record(get().root, `${id}:${Object.keys(patch).join(",")}`);
        const node = findNode(state.root, id);
        if (node) Object.assign(node, patch);
      }),

    addToSection: (sectionId, addition) =>
      set((state) => {
        record(get().root);
        const node = findNode(state.root, sectionId);
        if (
          !node ||
          !isComponentNode(node) ||
          node.type !== ComponentType.Section
        ) {
          return;
        }
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
        record(get().root);
        const node = findNode(state.root, galleryId);
        if (
          !node ||
          !isComponentNode(node) ||
          node.type !== ComponentType.MediaGallery
        ) {
          return;
        }
        const item = createGalleryItem();
        node.items.push(item);
        state.selectedId = item.id;
      }),

    addButton: (rowId) =>
      set((state) => {
        record(get().root);
        const node = findNode(state.root, rowId);
        if (!node || !isComponentNode(node) || node.type !== ComponentType.ActionRow) {
          return;
        }
        const button = createButton();
        node.components.push(button);
        state.selectedId = button.id;
      }),

    replaceDocument: (root) =>
      set((state) => {
        record(get().root);
        state.root = root;
        state.selectedId = root.id;
        state.collapsed = {};
      }),

    undo: () =>
      set((state) => {
        const previous = past.pop();
        if (!previous) return;
        future.push(get().root);
        lastKey = null;
        restore(state, previous);
      }),

    redo: () =>
      set((state) => {
        const next = future.pop();
        if (!next) return;
        past.push(get().root);
        lastKey = null;
        restore(state, next);
      }),
  })),
);
