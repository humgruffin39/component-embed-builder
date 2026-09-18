"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Segmented } from "@/components/ui/Field";
import { Header } from "@/components/builder/Header";
import { InspectorPanel } from "@/components/builder/InspectorPanel";
import { OutputPanel } from "@/components/builder/OutputPanel";
import { PreviewPanel } from "@/components/builder/PreviewPanel";
import { TreePanel } from "@/components/builder/TreePanel";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useUrlSync } from "@/hooks/useUrlSync";
import { validate } from "@/lib/validate";
import { useBuilder } from "@/store/builder";

type MobileTab = "edit" | "preview" | "output";

/** A 1px rule with a comfortable invisible hit area around it. */
const Handle = ({ vertical }: { vertical?: boolean }) => (
  <Separator
    className={clsx(
      "relative bg-line transition-colors data-[state=drag]:bg-accent data-[state=hover]:bg-line-strong",
      vertical ? "h-px w-full" : "w-px",
    )}
  >
    <span
      className={clsx(
        "absolute",
        vertical ? "inset-x-0 -top-1 h-3" : "inset-y-0 -left-1 w-3",
      )}
    />
  </Separator>
);

export const BuilderShell = () => {
  const root = useBuilder((state) => state.root);
  const [tab, setTab] = useState<MobileTab>("edit");

  const issues = useMemo(() => validate(root), [root]);
  const hashTooLong = useUrlSync(root);

  useUndoRedo();

  return (
    <div className="flex h-dvh flex-col">
      <Header />

      {hashTooLong && (
        <p className="border-b border-line bg-panel px-3 py-1.5 text-[12px] text-warn">
          This share link is getting long. Some clients truncate very long URLs.
        </p>
      )}

      <div className="flex items-center justify-center border-b border-line p-2 lg:hidden">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: "edit", label: "Edit" },
            { value: "preview", label: "Preview" },
            { value: "output", label: "Output" },
          ]}
        />
      </div>

      {/* Mobile shows one pane at a time; desktop shows three resizable ones. */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        {tab === "edit" && (
          <>
            <div className="min-h-0 flex-1 border-b border-line">
              <TreePanel root={root} />
            </div>
            <div className="min-h-0 flex-1">
              <InspectorPanel root={root} />
            </div>
          </>
        )}
        {tab === "preview" && <PreviewPanel root={root} />}
        {tab === "output" && <OutputPanel root={root} issues={issues} />}
      </div>

      <Group
        id="builder-columns"
        orientation="horizontal"
        className="hidden min-h-0 flex-1 lg:flex"
      >
        <Panel id="tree" defaultSize="18" minSize="12" maxSize="32">
          <TreePanel root={root} />
        </Panel>
        <Handle />
        <Panel id="inspector" defaultSize="26" minSize="16" maxSize="45">
          <InspectorPanel root={root} />
        </Panel>
        <Handle />
        <Panel id="right" defaultSize="56" minSize="25">
          <Group id="builder-rows" orientation="vertical" className="h-full">
            <Panel id="preview" defaultSize="58" minSize="15">
              <PreviewPanel root={root} />
            </Panel>
            <Handle vertical />
            <Panel id="output" defaultSize="42" minSize="12">
              <OutputPanel root={root} issues={issues} />
            </Panel>
          </Group>
        </Panel>
      </Group>
    </div>
  );
};
