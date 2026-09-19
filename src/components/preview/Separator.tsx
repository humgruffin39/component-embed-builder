import clsx from "clsx";
import { ComponentType, NODE_LABELS } from "@/lib/constants";
import type { SeparatorComponent } from "@/lib/payload";
import { useSelectable } from "./selection";

export const Separator = ({
  path,
  divider = true,
  spacing = 1,
}: SeparatorComponent & { path: string }) => {
  const selectable = useSelectable(path, NODE_LABELS[ComponentType.Separator]);
  return (
    <div
      {...selectable}
      className={clsx(
        "dc-separator",
        spacing === 2 && "dc-separator--large",
        !divider && "dc-separator--bare",
        selectable.className,
      )}
      role="separator"
    />
  );
};
