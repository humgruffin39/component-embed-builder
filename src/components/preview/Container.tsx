import { useState } from "react";
import clsx from "clsx";
import { ComponentType } from "@/lib/constants";
import type { ContainerChild, ContainerComponent } from "@/lib/payload";
import { ActionRow } from "./ActionRow";
import { MediaGallery } from "./MediaGallery";
import { Section } from "./Section";
import { Separator } from "./Separator";
import { TextDisplay } from "./TextDisplay";

const Child = (component: ContainerChild) => {
  switch (component.type) {
    case ComponentType.TextDisplay:
      return <TextDisplay {...component} />;
    case ComponentType.Section:
      return <Section {...component} />;
    case ComponentType.MediaGallery:
      return <MediaGallery {...component} />;
    case ComponentType.Separator:
      return <Separator {...component} />;
    case ComponentType.ActionRow:
      return <ActionRow {...component} />;
  }
};

const toCssColor = (accent: number | null | undefined): string | undefined =>
  typeof accent === "number"
    ? `#${accent.toString(16).padStart(6, "0")}`
    : undefined;

export const Container = ({
  accent_color: accentColor,
  spoiler,
  components,
}: ContainerComponent) => {
  const [revealed, setRevealed] = useState(false);

  // Toggling the flag off and on has to bring the blur back.
  const [lastSpoiler, setLastSpoiler] = useState(spoiler);
  if (spoiler !== lastSpoiler) {
    setLastSpoiler(spoiler);
    setRevealed(false);
  }

  const hidden = Boolean(spoiler) && !revealed;

  return (
    <div
      className={clsx(
        "dc-container",
        accentColor == null && "dc-container--plain",
        hidden && "dc-container--spoiler",
      )}
      style={{ "--dc-accent": toCssColor(accentColor) } as React.CSSProperties}
      onClick={hidden ? () => setRevealed(true) : undefined}
    >
      {components.map((component, index) => (
        <Child key={index} {...component} />
      ))}
    </div>
  );
};
