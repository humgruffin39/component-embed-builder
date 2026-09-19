import clsx from "clsx";
import { ComponentType, NODE_LABELS } from "@/lib/constants";
import type { TextDisplayComponent } from "@/lib/payload";
import { Markdown } from "./Markdown";
import { useSelectable } from "./selection";

export const TextDisplay = ({
  path,
  content,
}: TextDisplayComponent & { path: string }) => {
  const selectable = useSelectable(path, NODE_LABELS[ComponentType.TextDisplay]);
  return (
    <div {...selectable} className={clsx("dc-text", selectable.className)}>
      <Markdown content={content} />
    </div>
  );
};
