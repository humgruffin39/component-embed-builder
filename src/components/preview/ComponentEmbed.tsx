import clsx from "clsx";
import type { ComponentEmbedPayload } from "@/lib/payload";
import { Container } from "./Container";
import { ROOT_PATH, SelectionContext } from "./selection";

export type PreviewTheme = "light" | "dark";

interface ComponentEmbedProps {
  payload: ComponentEmbedPayload;
  theme?: PreviewTheme;
  className?: string;
  /** Structural path of the selected node, for the outline. */
  selectedPath?: string | null;
  /** Given, every rendered component becomes selectable instead of a link. */
  onSelectPath?: (path: string) => void;
  /** Which client to draw as. They do not show the same chrome. */
  platform?: "desktop" | "mobile";
}

/**
 * Renders a component embed the way a Discord client does. Everything it needs
 * arrives as props, so this tree has no dependency on the builder around it.
 */
export const ComponentEmbed = ({
  payload,
  theme = "dark",
  className,
  selectedPath = null,
  onSelectPath,
  platform = "desktop",
}: ComponentEmbedProps) => (
  <SelectionContext.Provider
    value={{ selectedPath, onSelect: onSelectPath ?? null, platform }}
  >
    <div className={clsx("dc-root", className)} data-dc-theme={theme}>
      <Container path={ROOT_PATH} {...payload.component} />
    </div>
  </SelectionContext.Provider>
);
