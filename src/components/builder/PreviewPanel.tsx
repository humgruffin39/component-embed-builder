"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { ComponentEmbed } from "@/components/preview";
import { Segmented } from "@/components/ui/Field";
import { type ContainerNode, toPayload } from "@/lib/document";
import { useBuilder } from "@/store/builder";

export const PreviewPanel = ({ root }: { root: ContainerNode }) => {
  const { previewTheme, previewWidth, setPreviewTheme, setPreviewWidth } =
    useBuilder();
  const payload = useMemo(() => toPayload(root), [root]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <h2 className="text-[13px] font-medium">Preview</h2>
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
        className="scroll-area flex-1 overflow-auto bg-[var(--dc-bg-chat)] p-4"
        data-dc-theme={previewTheme}
      >
        <ComponentEmbed
          payload={payload}
          theme={previewTheme}
          className={clsx("mx-auto", previewWidth === "mobile" && "max-w-[340px]")}
        />
      </div>

    </div>
  );
};
