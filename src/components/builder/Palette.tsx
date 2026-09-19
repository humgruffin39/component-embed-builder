"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { useDraggable } from "@dnd-kit/core";
import {
  ActionRowGlyph,
  ButtonGlyph,
  GalleryGlyph,
  ItemGlyph,
  SectionGlyph,
  SeparatorGlyph,
  TextGlyph,
  ThumbnailGlyph,
} from "@/components/ui/componentGlyphs";
import { ComponentType, LIMITS, NODE_LABELS } from "@/lib/constants";
import type { ContainerNode } from "@/lib/document";
import { destinationFor } from "@/lib/tree";
import { useBuilder } from "@/store/builder";

/** Marks a drag as coming from the palette rather than from the tree. */
export const PALETTE_PREFIX = "palette:";

export interface PaletteItem {
  key: string;
  label: string;
  description: string;
  glyph: (props: { className?: string }) => ReactNode;
  add: (index?: number) => void;
  disabled: boolean;
}

/** What can go into the place the selection points at, and what to call it. */
export const usePalette = (
  root: ContainerNode,
): { destination: string; items: PaletteItem[] } => {
  const { selectedId, addComponent, addToSection, addGalleryItem, addButton } =
    useBuilder();
  const target = destinationFor(root, selectedId);

  if (target.type === ComponentType.MediaGallery) {
    return {
      destination: NODE_LABELS[ComponentType.MediaGallery],
      items: [
        {
          key: "item",
          label: "Image",
          description: "Another picture or clip in this gallery",
          glyph: ItemGlyph,
          add: () => addGalleryItem(target.id),
          disabled: target.items.length >= LIMITS.galleryItemsMax,
        },
      ],
    };
  }

  if (target.type === ComponentType.ActionRow) {
    return {
      destination: NODE_LABELS[ComponentType.ActionRow],
      items: [
        {
          key: "button",
          label: "Button",
          description: "One more link button in this row",
          glyph: ButtonGlyph,
          add: () => addButton(target.id),
          disabled: target.components.length >= LIMITS.actionRowButtons,
        },
      ],
    };
  }

  if (target.type === ComponentType.Section) {
    return {
      destination: NODE_LABELS[ComponentType.Section],
      items: [
        {
          key: "text",
          label: "Text",
          description: "Another block of text in this section",
          glyph: TextGlyph,
          add: () => addToSection(target.id, "text"),
          disabled: target.components.length >= LIMITS.sectionTextMax,
        },
        {
          key: "thumbnail",
          label: "Thumbnail",
          description: "An image on the right, in place of what is there",
          glyph: ThumbnailGlyph,
          add: () => addToSection(target.id, "thumbnail"),
          disabled: false,
        },
        {
          key: "accessory-button",
          label: "Button",
          description: "A button on the right, in place of what is there",
          glyph: ButtonGlyph,
          add: () => addToSection(target.id, "button"),
          disabled: false,
        },
      ],
    };
  }

  const full = false;
  return {
    destination: NODE_LABELS[ComponentType.Container],
    items: [
      {
        key: String(ComponentType.TextDisplay),
        label: NODE_LABELS[ComponentType.TextDisplay],
        description: "Markdown. Headings, lists, links",
        glyph: TextGlyph,
        add: (index) => addComponent(ComponentType.TextDisplay, index),
        disabled: full,
      },
      {
        key: String(ComponentType.Section),
        label: NODE_LABELS[ComponentType.Section],
        description: "Text with an image or button beside it",
        glyph: SectionGlyph,
        add: (index) => addComponent(ComponentType.Section, index),
        disabled: full,
      },
      {
        key: String(ComponentType.MediaGallery),
        label: NODE_LABELS[ComponentType.MediaGallery],
        description: "Up to 10 images or videos",
        glyph: GalleryGlyph,
        add: (index) => addComponent(ComponentType.MediaGallery, index),
        disabled: full,
      },
      {
        key: String(ComponentType.Separator),
        label: NODE_LABELS[ComponentType.Separator],
        description: "A line, or just space",
        glyph: SeparatorGlyph,
        add: (index) => addComponent(ComponentType.Separator, index),
        disabled: full,
      },
      {
        key: String(ComponentType.ActionRow),
        label: NODE_LABELS[ComponentType.ActionRow],
        description: "Up to 5 link buttons",
        glyph: ActionRowGlyph,
        add: (index) => addComponent(ComponentType.ActionRow, index),
        disabled: full,
      },
    ],
  };
};

/** The card itself, with no drag wiring, so the overlay can reuse it as-is. */
export const TileFace = ({
  item,
  className,
}: {
  item: PaletteItem;
  className?: string;
}) => {
  const Glyph = item.glyph;
  return (
    <span
      className={clsx(
        "flex flex-col gap-1 rounded-lg border border-line bg-bg p-1.5",
        className,
      )}
    >
      <span className="flex h-7 items-center justify-center rounded-md bg-selected/70 text-muted transition-colors group-hover/tile:text-fg">
        <Glyph className="h-3.75 w-6" />
      </span>
      <span className="truncate px-0.5 text-left text-[11px] text-muted transition-colors group-hover/tile:text-fg">
        {item.label}
      </span>
    </span>
  );
};

const Tile = ({
  item,
  full,
  draggable,
  onAdded,
}: {
  item: PaletteItem;
  full: boolean;
  draggable: boolean;
  onAdded?: () => void;
}) => {
  const disabled = item.disabled || full;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${PALETTE_PREFIX}${item.key}`,
    // On a phone there is no tree to drag onto, and the sheet is not inside
    // the tree's drag context anyway.
    disabled: disabled || !draggable,
    data: { add: item.add, item },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      title={item.description}
      disabled={disabled}
      onClick={() => {
        item.add();
        onAdded?.();
      }}
      className={clsx(
        "group/tile flex text-left",
        draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        "shadow-raised transition-[transform,box-shadow] duration-150",
        "rounded-lg hover:-translate-y-px hover:shadow-float",
        "active:translate-y-0 active:shadow-raised",
        "disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none",
        isDragging && "opacity-40",
      )}
      {...attributes}
      {...listeners}
    >
      <TileFace item={item} className="w-full hover:border-line-strong" />
    </button>
  );
};

/**
 * The things that can be placed. The header names where they will land. Click
 * appends one, dragging puts it at a chosen spot.
 */
export const Palette = ({
  root,
  total,
  draggable = true,
  columns = 2,
  onAdded,
}: {
  root: ContainerNode;
  total: number;
  draggable?: boolean;
  columns?: number;
  /** Lets a sheet close itself once something has been placed. */
  onAdded?: () => void;
}) => {
  const { destination, items } = usePalette(root);
  const full = total >= LIMITS.components;

  return (
    <div className="border-t border-line p-2">
      <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <p className="min-w-0 truncate text-[11px] text-muted">
          Add to {destination}
        </p>
        <span className="shrink-0 text-[11px] text-faint tabular-nums">
          {total} / {LIMITS.components}
        </span>
      </div>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <Tile
            key={item.key}
            item={item}
            full={full}
            draggable={draggable}
            onAdded={onAdded}
          />
        ))}
      </div>
    </div>
  );
};
