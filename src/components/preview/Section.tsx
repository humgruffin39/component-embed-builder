import { ComponentType } from "@/lib/constants";
import type { SectionComponent } from "@/lib/payload";
import { LinkButton } from "./LinkButton";
import { Media } from "./Media";
import { TextDisplay } from "./TextDisplay";

export const Section = ({ components, accessory }: SectionComponent) => (
  <div className="dc-section">
    <div className="dc-section__body">
      {components.map((text, index) => (
        <TextDisplay key={index} {...text} />
      ))}
    </div>
    <div className="dc-section__accessory">
      {accessory.type === ComponentType.Thumbnail ? (
        <Media
          className="dc-thumbnail"
          url={accessory.media.url}
          description={accessory.description ?? undefined}
          spoiler={accessory.spoiler}
        />
      ) : (
        <LinkButton {...accessory} />
      )}
    </div>
  </div>
);
