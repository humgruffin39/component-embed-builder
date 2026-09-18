"use client";

import { type ReactNode, useState } from "react";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ComponentType, LIMITS } from "@/lib/constants";
import type { ContainerChildNode, ContainerNode, NodeId } from "@/lib/document";
import {
  INSERTABLE_TYPES,
  NODE_LABELS,
  countComponents,
  findNode,
  isComponentNode,
} from "@/lib/tree";
import { GalleryItemIcon, NODE_ICONS } from "@/components/ui/icons";
import { Menu } from "@/components/ui/Menu";
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

const Rows = ({ node, depth }: { node: ContainerChildNode; depth: number }) => {
  const {
    selectedId,
    collapsed,
    select,
    toggleCollapsed,
    removeNode,
    addToSection,
    addGalleryItem,
    addButton,
  } = useBuilder();

  const expanded = !collapsed[node.id];
  const common = {
    id: node.id,
    depth,
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
    const additions = [
      {
        label: "Add text",
        disabled: node.components.length >= LIMITS.sectionTextMax,
        onSelect: () => addToSection(node.id, "text" as const),
      },
      {
        label: "Add thumbnail accessory",
        onSelect: () => addToSection(node.id, "thumbnail" as const),
      },
      {
        label: "Add link button accessory",
        onSelect: () => addToSection(node.id, "button" as const),
      },
    ];

    return (
      <>
        <TreeRow
          {...groupProps}
          label={NODE_LABELS[node.type]}
          addLabel="Add to section"
          add={{
            render: (trigger) => (
              <Menu align="end" trigger={trigger} items={additions} />
            ),
          }}
        />
        {expanded && (
          <>
            <List ids={node.components.map((text) => text.id)}>
              {node.components.map((text) => (
                <TreeRow
                  key={text.id}
                  {...leaf(text.id, text.type)}
                  label={NODE_LABELS[text.type]}
                  detail={preview(text)}
                  onRemove={
                    node.components.length > 1
                      ? () => removeNode(text.id)
                      : undefined
                  }
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
        <TreeRow
          {...groupProps}
          label={NODE_LABELS[node.type]}
          addLabel="Add gallery item"
          addDisabled={node.items.length >= LIMITS.galleryItemsMax}
          add={{ onAdd: () => addGalleryItem(node.id) }}
        />
        {expanded && (
          <List ids={node.items.map((item) => item.id)}>
            {node.items.map((item, index) => (
              <TreeRow
                key={item.id}
                {...leaf(item.id, 0)}
                icon={GalleryItemIcon}
                label={`Item ${index + 1}`}
                detail={item.url.split("/").pop()}
                onRemove={
                  node.items.length > 1 ? () => removeNode(item.id) : undefined
                }
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
        <TreeRow
          {...groupProps}
          label={NODE_LABELS[node.type]}
          addLabel="Add button"
          addDisabled={node.components.length >= LIMITS.actionRowButtons}
          add={{ onAdd: () => addButton(node.id) }}
        />
        {expanded && (
          <List ids={node.components.map((button) => button.id)}>
            {node.components.map((button) => (
              <TreeRow
                key={button.id}
                {...leaf(button.id, button.type)}
                label={button.label || NODE_LABELS[button.type]}
                onRemove={
                  node.components.length > 1
                    ? () => removeNode(button.id)
                    : undefined
                }
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

export const TreePanel = ({ root }: { root: ContainerNode }) => {
  const { selectedId, select, moveNode, addComponent } = useBuilder();
  const [dragging, setDragging] = useState<NodeId | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const total = countComponents(root);
  const full = total >= LIMITS.components;

  const additions = INSERTABLE_TYPES.map((type) => ({
    label: `Add ${NODE_LABELS[type]}`,
    disabled: full,
    onSelect: () => addComponent(type),
  }));

  const draggedLabel = (() => {
    if (!dragging) return null;
    const node = findNode(root, dragging);
    if (!node) return null;
    return isComponentNode(node) ? NODE_LABELS[node.type] : "Item";
  })();

  return (
    <div className="flex h-full flex-col">
      <div className="scroll-area flex-1 overflow-y-auto p-2">
        <DndContext
          // A stable id keeps dnd-kit's aria ids identical across hydration.
          id="component-tree"
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={({ active }: DragStartEvent) =>
            setDragging(String(active.id))
          }
          onDragCancel={() => setDragging(null)}
          onDragEnd={({ active, over }: DragEndEvent) => {
            setDragging(null);
            if (over && active.id !== over.id) {
              moveNode(String(active.id), String(over.id));
            }
          }}
        >
          <div role="tree" aria-label="Embed components">
            <TreeRow
              id={root.id}
              label={NODE_LABELS[root.type]}
              icon={NODE_ICONS[root.type]}
              depth={0}
              flush
              selected={selectedId === root.id}
              sortable={false}
              onActivate={() => select(root.id)}
              addLabel="Add component"
              addDisabled={full}
              add={{
                render: (trigger) => (
                  <Menu align="end" trigger={trigger} items={additions} />
                ),
              }}
            />
            <List ids={root.components.map((child) => child.id)}>
              {root.components.map((child) => (
                <Rows key={child.id} node={child} depth={1} />
              ))}
            </List>
          </div>

          <DragOverlay dropAnimation={{ duration: 160 }}>
            {draggedLabel && (
              <div className="flex h-8 items-center rounded-md border border-line bg-panel px-3 text-[13px] font-medium text-fg shadow-lg shadow-black/30">
                {draggedLabel}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <p className="border-t border-line px-3 py-2 text-[11px] text-faint tabular-nums">
        {total} / {LIMITS.components} components
      </p>
    </div>
  );
};
