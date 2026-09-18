import clsx from "clsx";
import type { SeparatorComponent } from "@/lib/payload";

export const Separator = ({ divider = true, spacing = 1 }: SeparatorComponent) => (
  <div
    className={clsx(
      "dc-separator",
      spacing === 2 && "dc-separator--large",
      !divider && "dc-separator--bare",
    )}
    role="separator"
  />
);
