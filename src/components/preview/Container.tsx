import { useState } from "react";
import clsx from "clsx";
import { ComponentType, NODE_LABELS } from "@/lib/constants";
import type { ContainerChild, ContainerComponent } from "@/lib/payload";
import { ActionRow } from "./ActionRow";
import { MediaGallery } from "./MediaGallery";
import { Section } from "./Section";
import { Separator } from "./Separator";
import { TextDisplay } from "./TextDisplay";
import { childPath, useSelectable } from "./selection";

const Child = ({
  path,
  ...component
}: ContainerChild & { path: string }) => {
  switch (component.type) {
    case ComponentType.TextDisplay:
      return <TextDisplay path={path} {...component} />;
    case ComponentType.Section:
      return <Section path={path} {...component} />;
    case ComponentType.MediaGallery:
      return <MediaGallery path={path} {...component} />;
    case ComponentType.Separator:
      return <Separator path={path} {...component} />;
    case ComponentType.ActionRow:
      return <ActionRow path={path} {...component} />;
  }
};

const toCssColor = (accent: number | null | undefined): string | undefined =>
  typeof accent === "number"
    ? `#${accent.toString(16).padStart(6, "0")}`
    : undefined;

export const Container = ({
  path,
  accent_color: accentColor,
  spoiler,
  components,
}: ContainerComponent & { path: string }) => {
  const [revealed, setRevealed] = useState(false);
  const selectable = useSelectable(path, NODE_LABELS[ComponentType.Container]);

  // Toggling the flag off and on has to bring the blur back.
  const [lastSpoiler, setLastSpoiler] = useState(spoiler);
  if (spoiler !== lastSpoiler) {
    setLastSpoiler(spoiler);
    setRevealed(false);
  }

  const hidden = Boolean(spoiler) && !revealed;

  return (
    <div
      {...selectable}
      className={clsx(
        "dc-container",
        accentColor == null && "dc-container--plain",
        hidden && "dc-container--spoiler",
        selectable.className,
      )}
      style={{ "--dc-accent": toCssColor(accentColor) } as React.CSSProperties}
      onClick={(event) => {
        // A covered spoiler reveals itself first; selecting is harmless either way.
        if (hidden) setRevealed(true);
        selectable.onClick?.(event);
      }}
    >
      {components.map((component, index) => (
        <Child
          key={index}
          path={childPath(path, "components", index)}
          {...component}
        />
      ))}
    </div>
  );
};
