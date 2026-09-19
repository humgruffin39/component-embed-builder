"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { ComponentEmbed } from "@/components/preview";
import { Segmented } from "@/components/ui/Field";
import { type ContainerNode, toPayload } from "@/lib/document";
import { nodeAtPath, pathOfNode } from "@/lib/tree";
import { useBuilder } from "@/store/builder";

export const PreviewPanel = ({
  root,
  onPick,
}: {
  root: ContainerNode;
  /** Called after a tap selects something, so a phone can open the editor. */
  onPick?: () => void;
}) => {
  const { previewTheme, previewWidth, setPreviewTheme, setPreviewWidth } =
    useBuilder();
  const selectedId = useBuilder((state) => state.selectedId);
  const select = useBuilder((state) => state.select);
  const payload = useMemo(() => toPayload(root), [root]);

  // The payload has no ids, so selection crosses over by structural path.
  const selectedPath = selectedId ? pathOfNode(root, selectedId) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <h2 className="hidden text-[13px] font-medium lg:block">Preview</h2>
        <div className="flex gap-1.5">
          <Segmented
            value={previewWidth}
            onChange={setPreviewWidth}
            options={[
              { value: "desktop", label: "Desktop" },
              { value: "mobile", label: "Mobile" },
            ]}
          />
          <Segmented
            value={previewTheme}
            onChange={setPreviewTheme}
            options={[
              { value: "dark", label: "Dark" },
              { value: "light", label: "Light" },
            ]}
          />
        </div>
      </div>

      <div
        className="scroll-area flex-1 overflow-auto bg-(--dc-bg-chat) p-4"
        data-dc-theme={previewTheme}
      >
        <ComponentEmbed
          payload={payload}
          theme={previewTheme}
          selectedPath={selectedPath}
          platform={previewWidth}
          onSelectPath={(path) => {
            const node = nodeAtPath(root, path);
            if (!node) return;
            select(node.id);
            onPick?.();
          }}
          className={clsx("mx-auto", previewWidth === "mobile" && "max-w-85")}
        />
      </div>

    </div>
  );
};
