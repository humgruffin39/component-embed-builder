"use client";

import { useState } from "react";
import { InspectorPanel } from "@/components/builder/InspectorPanel";
import { OutputPanel } from "@/components/builder/OutputPanel";
import { Palette } from "@/components/builder/Palette";
import { PreviewPanel } from "@/components/builder/PreviewPanel";
import { TreePanel } from "@/components/builder/TreePanel";
import { Sheet } from "@/components/ui/Sheet";
import { CodeIcon, ListIcon, PlusIcon, SlidersIcon } from "@/components/ui/icons";
import type { ContainerNode } from "@/lib/document";
import { countComponents, labelForNode } from "@/lib/tree";
import { type Issue, countByLevel } from "@/lib/validate";
import { useBuilder } from "@/store/builder";
import { Button } from "@/components/ui/Button";

type SheetName = "add" | "edit" | "code" | "tree";

const Tab = ({
  label,
  hint,
  icon: Icon,
  badge,
  onClick,
}: {
  label: string;
  /** What the tab does, for anyone who cannot see the icon above it. */
  hint: string;
  icon: typeof PlusIcon;
  badge?: number;
  onClick: () => void;
}) => (
  <button
    type="button"
    aria-label={badge ? `${hint}, ${badge} to fix` : hint}
    onClick={onClick}
    className="flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg py-2 text-muted transition-colors active:bg-selected"
  >
    <span className="relative">
      <Icon size={17} ariaHidden />
      {badge !== undefined && badge > 0 && (
        <span
          aria-hidden
          className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white tabular-nums"
        >
          {badge}
        </span>
      )}
    </span>
    <span
      aria-hidden
      className="w-full truncate px-1 text-center text-[11px] leading-none"
    >
      {label}
    </span>
  </button>
);

/**
 * On a phone the preview is the app. Everything else lives in a sheet and
 * comes up when asked for.
 */
export const MobileShell = ({
  root,
  issues,
}: {
  root: ContainerNode;
  issues: Issue[];
}) => {
  const selectedId = useBuilder((state) => state.selectedId);
  const removeNode = useBuilder((state) => state.removeNode);
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const close = () => setSheet(null);

  const total = countComponents(root);
  const errors = countByLevel(issues, "error");
  const selectedLabel = labelForNode(root, selectedId);
  const canRemove = selectedId !== null && selectedId !== root.id;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 pt-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-panel shadow-raised">
        {/* Tapping a component is an intent to edit it, so the sheet opens
            with it rather than making the nav a second stop. */}
        <PreviewPanel root={root} onPick={() => setSheet("edit")} />
      </div>

      <nav className="flex shrink-0 items-stretch gap-1 rounded-xl bg-panel p-1 shadow-raised">
        <Tab
          label="Add"
          hint="Add a component"
          icon={PlusIcon}
          onClick={() => setSheet("add")}
        />
        <Tab
          label={selectedLabel}
          hint={`Edit the selected ${selectedLabel}`}
          icon={SlidersIcon}
          onClick={() => setSheet("edit")}
        />
        <Tab
          label="Layers"
          hint="Reorder and delete components"
          icon={ListIcon}
          onClick={() => setSheet("tree")}
        />
        <Tab
          label="Code"
          hint="Copy the output"
          icon={CodeIcon}
          badge={errors}
          onClick={() => setSheet("code")}
        />
      </nav>

      <Sheet
        open={sheet === "add"}
        onOpenChange={close}
        title="Add"
        detail={`${total} of 40 used`}
      >
        {/* Closing on choice puts the new component on screen straight away. */}
        <div className="scroll-area max-h-[60dvh] overflow-y-auto">
          <Palette
            root={root}
            total={total}
            draggable={false}
            columns={3}
            onAdded={close}
          />
        </div>
      </Sheet>

      <Sheet
        open={sheet === "edit"}
        onOpenChange={close}
        title={selectedLabel}
        description="Settings for the selected component"
      >
        <div className="flex max-h-[58dvh] flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <InspectorPanel root={root} hideHeader />
          </div>
          {canRemove && (
            <div className="shrink-0 px-3 pt-1 pb-3">
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  removeNode(selectedId);
                  close();
                }}
              >
                Delete {selectedLabel}
              </Button>
            </div>
          )}
        </div>
      </Sheet>

      <Sheet
        open={sheet === "tree"}
        onOpenChange={close}
        title="Layers"
        description="Reorder or delete the components in this embed"
      >
        <div className="max-h-[58dvh] min-h-40">
          <TreePanel root={root} hidePalette />
        </div>
      </Sheet>

      <Sheet
        open={sheet === "code"}
        onOpenChange={close}
        title="Code"
        detail={errors > 0 ? `${errors} to fix` : undefined}
      >
        <div className="h-[68dvh]">
          <OutputPanel root={root} issues={issues} />
        </div>
      </Sheet>
    </div>
  );
};
