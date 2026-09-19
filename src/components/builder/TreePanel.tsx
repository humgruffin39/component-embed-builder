"use client";

import clsx from "clsx";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useState,
} from "react";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ComponentType, NODE_LABELS } from "@/lib/constants";
import type { ContainerChildNode, ContainerNode, NodeId } from "@/lib/document";
import {
  ancestorsOf,
  countComponents,
  findNode,
  isComponentNode,
  visibleRows,
} from "@/lib/tree";
import { GalleryItemIcon, NODE_ICONS } from "@/components/ui/icons";
import {
  PALETTE_PREFIX,
  Palette,
  type PaletteItem,
  TileFace,
} from "@/components/builder/Palette";
import { TreeRow } from "@/components/builder/TreeRow";
import { useBuilder } from "@/store/builder";

const preview = (node: ContainerChildNode): string | undefined => {
  switch (node.type) {
    case ComponentType.TextDisplay:
      return node.content.replace(/\s+/g, " ").slice(0, 40);
    case ComponentType.Separator:
      return node.spacing === 2 ? "Large" : "Small";
    default:
      return undefined;
  }
};

const List = ({ ids, children }: { ids: NodeId[]; children: ReactNode }) => (
  <SortableContext items={ids} strategy={verticalListSortingStrategy}>
    <div role="group">{children}</div>
  </SortableContext>
);

/**
 * Which slot in the container a drop lands in. Dropping on anything nested
 * counts as dropping on the top-level component it sits inside.
 */
const topLevelIndex = (root: ContainerNode, overId: NodeId): number => {
  const index = root.components.findIndex((child) => child.id === overId);
  if (index !== -1) return index;
  for (const ancestor of ancestorsOf(root, overId)) {
    const nested = root.components.findIndex((c) => c.id === ancestor.id);
    if (nested !== -1) return nested;
  }
  return root.components.length;
};

const Rows = ({
  node,
  depth,
  dropBefore = false,
}: {
  node: ContainerChildNode;
  depth: number;
  dropBefore?: boolean;
}) => {
  const { selectedId, collapsed, select, toggleCollapsed, removeNode } =
    useBuilder();

  const expanded = !collapsed[node.id];
  const common = {
    id: node.id,
    depth,
    dropBefore,
    onRemove: () => removeNode(node.id),
  };
  const groupProps = {
    ...common,
    icon: NODE_ICONS[node.type],
    group: true as const,
    expanded,
    onActivate: () => toggleCollapsed(node.id),
  };
  const leaf = (id: NodeId, type: number) => ({
    id,
    depth: depth + 1,
    icon: NODE_ICONS[type],
    selected: selectedId === id,
    onActivate: () => select(id),
  });

  if (node.type === ComponentType.Section) {
    return (
      <>
        <TreeRow {...groupProps} label={NODE_LABELS[node.type]} />
        {expanded && (
          <>
            <List ids={node.components.map((text) => text.id)}>
              {node.components.map((text) => (
                <TreeRow
                  key={text.id}
                  {...leaf(text.id, text.type)}
                  label={NODE_LABELS[text.type]}
                  detail={preview(text)}
                  onRemove={() => removeNode(text.id)}
                />
              ))}
            </List>
            <TreeRow
              {...leaf(node.accessory.id, node.accessory.type)}
              label={NODE_LABELS[node.accessory.type]}
              sortable={false}
            />
          </>
        )}
      </>
    );
  }

  if (node.type === ComponentType.MediaGallery) {
    return (
      <>
        <TreeRow {...groupProps} label={NODE_LABELS[node.type]} />
        {expanded && (
          <List ids={node.items.map((item) => item.id)}>
            {node.items.map((item, index) => (
              <TreeRow
                key={item.id}
                {...leaf(item.id, 0)}
                icon={GalleryItemIcon}
                label={`Item ${index + 1}`}
                detail={item.url.split("/").pop()}
                onRemove={() => removeNode(item.id)}
              />
            ))}
          </List>
        )}
      </>
    );
  }

  if (node.type === ComponentType.ActionRow) {
    return (
      <>
        <TreeRow {...groupProps} label={NODE_LABELS[node.type]} />
        {expanded && (
          <List ids={node.components.map((button) => button.id)}>
            {node.components.map((button) => (
              <TreeRow
                key={button.id}
                {...leaf(button.id, button.type)}
                label={button.label || NODE_LABELS[button.type]}
                onRemove={() => removeNode(button.id)}
              />
            ))}
          </List>
        )}
      </>
    );
  }

  return (
    <TreeRow
      {...common}
      icon={NODE_ICONS[node.type]}
      selected={selectedId === node.id}
      onActivate={() => select(node.id)}
      label={NODE_LABELS[node.type]}
      detail={preview(node)}
    />
  );
};

export const TreePanel = ({
  root,
  hidePalette = false,
}: {
  root: ContainerNode;
  /** The phone reaches the palette from its own sheet. */
  hidePalette?: boolean;
}) => {
  const { selectedId, select, moveNode, collapsed, toggleCollapsed } =
    useBuilder();
  const [dragging, setDragging] = useState<NodeId | null>(null);
  // Kept so the overlay can lift the very card that was picked up.
  const [picked, setPicked] = useState<PaletteItem | null>(null);
  const [overId, setOverId] = useState<NodeId | null>(null);

  /** Arrow keys walk the rows on screen, as a `role="tree"` is expected to. */
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    // dnd-kit drives a keyboard drag with the same keys, so stay out of its way.
    if (dragging) return;
    const keys = [
      "ArrowDown",
      "ArrowUp",
      "ArrowRight",
      "ArrowLeft",
      "Home",
      "End",
    ];
    if (!keys.includes(event.key)) return;

    const rows = visibleRows(root, collapsed);
    const current = Math.max(
      0,
      rows.findIndex((row) => row.id === selectedId),
    );
    const row = rows[current];

    let next = current;
    if (event.key === "ArrowDown")
      next = Math.min(rows.length - 1, current + 1);
    else if (event.key === "ArrowUp") next = Math.max(0, current - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = rows.length - 1;
    else if (event.key === "ArrowRight") {
      if (row?.group && collapsed[row.id]) {
        toggleCollapsed(row.id);
        event.preventDefault();
        return;
      }
      next = Math.min(rows.length - 1, current + 1);
    } else if (event.key === "ArrowLeft") {
      if (row?.group && !collapsed[row.id]) {
        toggleCollapsed(row.id);
        event.preventDefault();
        return;
      }
      next = rows.findIndex((entry) => entry.id === row?.parentId);
      if (next === -1) next = current;
    }

    event.preventDefault();
    const target = rows[next];
    if (!target) return;
    select(target.id);
    // Focus follows selection, so the next key press lands in the same place.
    requestAnimationFrame(() => {
      const element = event.currentTarget?.querySelector<HTMLElement>(
        `[data-tree-row="${target.id}"]`,
      );
      element?.focus();
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const draggedLabel = (() => {
    if (!dragging || dragging.startsWith(PALETTE_PREFIX)) return null;
    const node = findNode(root, dragging);
    if (!node) return null;
    return isComponentNode(node) ? NODE_LABELS[node.type] : "Item";
  })();

  const total = countComponents(root);
  const dropIndex = overId ? topLevelIndex(root, overId) : null;

  return (
    // Selection is left alone, except while dragging: that is when a stray
    // selection appears, bringing the touch handles with it.
    <div className={clsx("flex h-full flex-col", dragging && "select-none")}>
      <DndContext
        // A stable id keeps dnd-kit's aria ids identical across hydration.
        id="component-tree"
        sensors={sensors}
        // closestCenter always finds a row, however far away the pointer is,
        // so a palette tile dropped anywhere would land. pointerWithin only
        // answers when the pointer is genuinely over a row.
        collisionDetection={
          dragging?.startsWith(PALETTE_PREFIX) ? pointerWithin : closestCenter
        }
        modifiers={
          dragging?.startsWith(PALETTE_PREFIX) ? [] : [restrictToVerticalAxis]
        }
        onDragStart={({ active }: DragStartEvent) => {
          setDragging(String(active.id));
          setPicked(
            (active.data.current as { item?: PaletteItem } | undefined)?.item ??
              null,
          );
        }}
        onDragOver={({ over }: DragOverEvent) =>
          setOverId(over ? String(over.id) : null)
        }
        onDragCancel={() => {
          setDragging(null);
          setPicked(null);
          setOverId(null);
        }}
        onDragEnd={({ active, over }: DragEndEvent) => {
          setDragging(null);
          setPicked(null);
          setOverId(null);
          const id = String(active.id);
          // A palette tile carries its own action; a tree row is a move.
          if (id.startsWith(PALETTE_PREFIX)) {
            if (over) {
              const data = active.data.current as {
                add: (index?: number) => void;
              };
              data.add(topLevelIndex(root, String(over.id)));
            }
            return;
          }
          if (over && id !== over.id) moveNode(id, String(over.id));
        }}
      >
        <div className="scroll-area flex-1 overflow-y-auto p-2">
          <div role="tree" aria-label="Embed components" onKeyDown={onKeyDown}>
            <TreeRow
              id={root.id}
              label={NODE_LABELS[root.type]}
              icon={NODE_ICONS[root.type]}
              depth={0}
              flush
              selected={selectedId === root.id}
              sortable={false}
              onActivate={() => select(root.id)}
            />
            <List ids={root.components.map((child) => child.id)}>
              {root.components.map((child, index) => (
                <Rows
                  key={child.id}
                  node={child}
                  depth={1}
                  dropBefore={
                    dropIndex === index && dragging?.startsWith(PALETTE_PREFIX)
                  }
                />
              ))}
            </List>
          </div>
        </div>

        {!hidePalette && <Palette root={root} total={total} />}

        <DragOverlay dropAnimation={{ duration: 160 }}>
          {/* The very card that was picked up, not a stand-in for it. */}
          {picked && (
            <TileFace item={picked} className="w-28 bg-panel shadow-float" />
          )}
          {draggedLabel && (
            <div className="flex h-8 items-center rounded-md border border-line bg-panel px-3 text-[13px] font-medium text-fg shadow-float">
              {draggedLabel}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
