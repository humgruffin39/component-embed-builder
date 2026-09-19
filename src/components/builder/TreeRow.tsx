"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronIcon,
  GripIcon,
  type Icon,
  PlusIcon,
  TrashIcon,
} from "@/components/ui/icons";
import type { NodeId } from "@/lib/document";

export interface TreeRowProps {
  id: NodeId;
  label: string;
  detail?: string;
  depth: number;
  icon: Icon;
  /** Group rows fold their children instead of opening in the inspector. */
  group?: boolean;
  expanded?: boolean;
  selected?: boolean;
  sortable?: boolean;
  /** The root row sits flush with the drag handles below it. */
  flush?: boolean;
  /** A card is hovering here, so the row shows where it would go in. */
  dropBefore?: boolean;
  onActivate: () => void;
  /** Either a menu the caller renders around the trigger, or a direct action. */
  add?: { render: (trigger: ReactNode) => ReactNode } | { onAdd: () => void };
  addLabel?: string;
  addDisabled?: boolean;
  onRemove?: () => void;
}

/** Shape only. Each action sets its own hover colour, or the two fight. */
const ACTION =
  "flex size-6 shrink-0 items-center justify-center rounded text-faint transition-colors";

export const TreeRow = ({
  id,
  label,
  detail,
  depth,
  icon: NodeIcon,
  group = false,
  expanded = true,
  selected = false,
  sortable = true,
  flush = false,
  dropBefore = false,
  onActivate,
  add,
  addLabel = "Add",
  addDisabled,
  onRemove,
}: TreeRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !sortable });

  const addTrigger = add && (
    <button
      type="button"
      aria-label={addLabel}
      disabled={addDisabled}
      className={clsx(
        ACTION,
        "hover:text-fg disabled:pointer-events-none disabled:opacity-30",
      )}
      onClick={(event) => {
        event.stopPropagation();
        if ("onAdd" in add) add.onAdd();
      }}
    >
      <PlusIcon size={14} ariaHidden />
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={clsx("relative", isDragging && "z-10 opacity-40")}
    >
      {dropBefore && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-px right-0 left-0 z-10 h-0.5 rounded-full bg-accent"
        />
      )}
      <div
        role="treeitem"
        data-tree-row={id}
        tabIndex={selected ? 0 : -1}
        aria-level={depth + 1}
        aria-selected={group ? undefined : selected}
        aria-expanded={group ? expanded : undefined}
        onClick={onActivate}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onActivate();
          }
        }}
        className={clsx(
          "group relative flex h-8 cursor-pointer items-center gap-1.5 rounded-md pr-1 text-[13px] transition-colors",
          // An open menu keeps the row lit, so it does not blink out mid-click.
          selected
            ? "bg-selected text-fg"
            : "text-muted hover:bg-selected/60 has-data-[state=open]:bg-selected/60",
        )}
        style={{ paddingLeft: `${depth * 14 + (flush ? 16 : 2)}px` }}
      >
        {!flush && (
          <button
            type="button"
            aria-label={`Reorder ${label}`}
            className={clsx(
              "flex size-5 shrink-0 cursor-grab items-center justify-center text-faint opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 active:cursor-grabbing",
              !sortable && "invisible",
            )}
            onClick={(event) => event.stopPropagation()}
            {...attributes}
            {...listeners}
            tabIndex={sortable ? attributes.tabIndex : -1}
          >
            <GripIcon size={14} ariaHidden />
          </button>
        )}

        {group && (
          <ChevronIcon
            size={13}
            ariaHidden
            className={clsx(
              "-mr-0.5 shrink-0 text-faint transition-transform duration-150",
              expanded && "rotate-90",
            )}
          />
        )}

        <NodeIcon size={14} ariaHidden className="shrink-0 text-faint" />

        {/* One baseline for both, so the smaller detail does not float. */}
        <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
          <span className={clsx("shrink-0", selected && "font-medium")}>
            {label}
          </span>
          {detail && (
            <span className="min-w-0 truncate text-[11px] text-faint">
              {detail}
            </span>
          )}
        </span>

        <div className="ml-auto flex shrink-0 items-center">
          {/* Adding is how a new user gets started, so it always shows.
              Deleting is not, and stays on hover. */}
          {add && ("render" in add ? add.render(addTrigger) : addTrigger)}
        </div>

        <div className="flex shrink-0 items-center opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 has-data-[state=open]:opacity-100">
          {onRemove && (
            <button
              type="button"
              aria-label={`Delete ${label}`}
              className={clsx(ACTION, "hover:bg-danger/12 hover:text-danger")}
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
            >
              <TrashIcon size={14} ariaHidden />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
