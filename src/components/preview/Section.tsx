import { ComponentType, NODE_LABELS } from "@/lib/constants";
import type { SectionComponent } from "@/lib/payload";
import { LinkButton } from "./LinkButton";
import { Media } from "./Media";
import { TextDisplay } from "./TextDisplay";
import { childPath } from "./selection";

export const Section = ({
  path,
  components,
  accessory,
}: SectionComponent & { path: string }) => (
  <div className="dc-section">
    <div className="dc-section__body">
      {components.map((text, index) => (
        <TextDisplay
          key={index}
          path={childPath(path, "components", index)}
          {...text}
        />
      ))}
    </div>
    <div className="dc-section__accessory">
      {accessory.type === ComponentType.Thumbnail ? (
        <Media
          className="dc-thumbnail"
          path={childPath(path, "accessory")}
          label={NODE_LABELS[ComponentType.Thumbnail]}
          url={accessory.media.url}
          description={accessory.description ?? undefined}
          spoiler={accessory.spoiler}
        />
      ) : (
        <LinkButton path={childPath(path, "accessory")} {...accessory} />
      )}
    </div>
  </div>
);
