import clsx from "clsx";
import { ComponentType, NODE_LABELS } from "@/lib/constants";
import type { ButtonComponent } from "@/lib/payload";
import { useSelectable } from "./selection";

/**
 * Discord's own launch icon, taken from its client rather than matched by eye:
 * a bracket with the arrow leaving it, drawn as two filled paths on a 24x24
 * box. The rounded arcs are how that set fakes stroke caps.
 */
const LaunchIcon = () => (
  <svg
    className="dc-button__icon"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="M15 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V4.41l-4.3 4.3a1 1 0 1 1-1.4-1.42L19.58 3H16a1 1 0 0 1-1-1Z"
    />
    <path
      fill="currentColor"
      d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-6a1 1 0 1 0-2 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6a1 1 0 1 0 0-2H5Z"
    />
  </svg>
);

export const LinkButton = ({
  path,
  label,
  url,
  emoji,
}: ButtonComponent & { path: string }) => {
  const selectable = useSelectable(path, NODE_LABELS[ComponentType.Button]);
  // While the preview is selectable the button is a target, not a way out.
  const selecting = Boolean(selectable.onClick);

  return (
    <a
      {...selectable}
      className={clsx("dc-button", selectable.className)}
      href={selecting ? undefined : url || undefined}
      target={selecting ? undefined : "_blank"}
      rel={selecting ? undefined : "noopener noreferrer"}
    >
      {emoji?.name && <span className="dc-button__emoji">{emoji.name}</span>}
      {label && <span>{label}</span>}
      <LaunchIcon />
    </a>
  );
};
