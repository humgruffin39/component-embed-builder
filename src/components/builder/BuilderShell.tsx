"use client";

import { type ReactNode, useMemo } from "react";
import clsx from "clsx";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Header } from "@/components/builder/Header";
import { InspectorPanel } from "@/components/builder/InspectorPanel";
import { MobileShell } from "@/components/builder/MobileShell";
import { OutputPanel } from "@/components/builder/OutputPanel";
import { PreviewPanel } from "@/components/builder/PreviewPanel";
import { TreePanel } from "@/components/builder/TreePanel";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useUrlSync } from "@/hooks/useUrlSync";
import { validate } from "@/lib/validate";
import { useBuilder } from "@/store/builder";

/**
 * The gap between two panels, rather than a rule drawn across them. A grip
 * surfaces on hover so the gutter still reads as something you can pull.
 */
const Handle = ({ vertical }: { vertical?: boolean }) => (
  <Separator
    className={clsx(
      "group flex shrink-0 items-center justify-center",
      vertical ? "h-2 w-full cursor-row-resize" : "w-2 cursor-col-resize",
    )}
  >
    <span
      className={clsx(
        "rounded-full bg-line-strong opacity-0 transition-opacity group-hover:opacity-100 group-data-[state=drag]:opacity-100 group-data-[state=hover]:opacity-100",
        vertical ? "h-0.75 w-10" : "h-10 w-0.75",
      )}
    />
  </Separator>
);

/** Each panel is a surface lifted off the background, not a walled-off cell. */
const Card = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={clsx(
      "h-full overflow-hidden rounded-xl bg-panel shadow-raised",
      className,
    )}
  >
    {children}
  </div>
);

export const BuilderShell = () => {
  const root = useBuilder((state) => state.root);
  const issues = useMemo(() => validate(root), [root]);
  const hashTooLong = useUrlSync(root);

  useUndoRedo();

  return (
    <div className="flex h-dvh flex-col">
      <Header />

      {hashTooLong && (
        <p className="mx-2 rounded-lg bg-warn/12 px-3 py-1.5 text-[12px] text-warn">
          This share link is getting long. Some clients truncate very long URLs.
        </p>
      )}

      <MobileShell root={root} issues={issues} />

      {/* Group writes its own inline display, so the class that hides it has
          to sit on a wrapper or the phone gets the desktop layout as well. */}
      <div className="hidden min-h-0 flex-1 lg:flex">
        <Group
          id="builder-columns"
          orientation="horizontal"
          className="min-h-0 flex-1 p-2 pt-0"
        >
        <Panel id="tree" defaultSize="18" minSize="12" maxSize="32">
          <Card>
            <TreePanel root={root} />
          </Card>
        </Panel>
        <Handle />
        <Panel id="inspector" defaultSize="26" minSize="16" maxSize="45">
          <Card>
            <InspectorPanel root={root} />
          </Card>
        </Panel>
        <Handle />
        <Panel id="right" defaultSize="56" minSize="25">
          <Group id="builder-rows" orientation="vertical" className="h-full">
            <Panel id="preview" defaultSize="58" minSize="15">
              <Card>
                <PreviewPanel root={root} />
              </Card>
            </Panel>
            <Handle vertical />
            <Panel id="output" defaultSize="42" minSize="12">
              <Card>
                <OutputPanel root={root} issues={issues} />
              </Card>
            </Panel>
          </Group>
        </Panel>
        </Group>
      </div>
    </div>
  );
};
