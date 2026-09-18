import type { ActionRowComponent } from "@/lib/payload";
import { LinkButton } from "./LinkButton";

export const ActionRow = ({ components }: ActionRowComponent) => (
  <div className="dc-action-row">
    {components.map((button, index) => (
      <LinkButton key={index} {...button} />
    ))}
  </div>
);
