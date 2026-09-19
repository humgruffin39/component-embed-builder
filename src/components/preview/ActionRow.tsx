import type { ActionRowComponent } from "@/lib/payload";
import { LinkButton } from "./LinkButton";
import { childPath } from "./selection";

export const ActionRow = ({
  path,
  components,
}: ActionRowComponent & { path: string }) => (
  <div className="dc-action-row">
    {components.map((button, index) => (
      <LinkButton
        key={index}
        path={childPath(path, "components", index)}
        {...button}
      />
    ))}
  </div>
);
