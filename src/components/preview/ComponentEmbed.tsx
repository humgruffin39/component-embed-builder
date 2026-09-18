import clsx from "clsx";
import type { ComponentEmbedPayload } from "@/lib/payload";
import { Container } from "./Container";

export type PreviewTheme = "light" | "dark";

interface ComponentEmbedProps {
  payload: ComponentEmbedPayload;
  theme?: PreviewTheme;
  className?: string;
}

/**
 * Renders a component embed the way a Discord client does. Everything it needs
 * arrives as props, so this tree has no dependency on the builder around it.
 */
export const ComponentEmbed = ({
  payload,
  theme = "dark",
  className,
}: ComponentEmbedProps) => (
  <div className={clsx("dc-root", className)} data-dc-theme={theme}>
    <Container {...payload.component} />
  </div>
);
