"use client";

import { useState } from "react";
import clsx from "clsx";
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

type SheetName = "add" | "edit" | "code" | "tree";

const Tab = ({
  label,
  icon: Icon,
  badge,
  onClick,
}: {
  label: string;
  icon: typeof PlusIcon;
  badge?: number;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg py-2 text-muted transition-colors active:bg-selected"
  >
    <span className="relative">
      <Icon size={17} ariaHidden />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white tabular-nums">
          {badge}
        </span>
      )}
    </span>
    <span className="w-full truncate px-1 text-center text-[11px] leading-none">
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
  const [sheet, setSheet] = useState<SheetName | null>(null);
  const close = () => setSheet(null);

  const total = countComponents(root);
  const errors = countByLevel(issues, "error");

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 pt-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-panel shadow-raised">
        <PreviewPanel root={root} />
      </div>

      <nav className="flex shrink-0 items-stretch gap-1 rounded-xl bg-panel p-1 shadow-raised">
        <Tab label="Add" icon={PlusIcon} onClick={() => setSheet("add")} />
        <Tab
          label={labelForNode(root, selectedId)}
          icon={SlidersIcon}
          onClick={() => setSheet("edit")}
        />
        <Tab label="Layers" icon={ListIcon} onClick={() => setSheet("tree")} />
        <Tab
          label="Code"
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
        <div className="scroll-area max-h-[60dvh] overflow-y-auto">
          <Palette root={root} total={total} draggable={false} columns={3} />
        </div>
      </Sheet>

      <Sheet
        open={sheet === "edit"}
        onOpenChange={close}
        title={labelForNode(root, selectedId)}
        detail="Tap the preview to pick another"
      >
        <div className="h-[58dvh]">
          <InspectorPanel root={root} hideHeader />
        </div>
      </Sheet>

      <Sheet open={sheet === "tree"} onOpenChange={close} title="Layers">
        <div className="h-[58dvh]">
          <TreePanel root={root} hidePalette />
        </div>
      </Sheet>

      <Sheet
        open={sheet === "code"}
        onOpenChange={close}
        title="Code"
        detail={errors > 0 ? `${errors} to fix` : undefined}
      >
        <div className={clsx("h-[68dvh]")}>
          <OutputPanel root={root} issues={issues} />
        </div>
      </Sheet>
    </div>
  );
};
