import clsx from "clsx";
import type { MediaGalleryComponent } from "@/lib/payload";
import { Media } from "./Media";
import { childPath } from "./selection";

/**
 * Discord's gallery layout, read off the rendered examples in its docs: one
 * item fills the width, two or four sit in a grid, and three become a large
 * tile beside two stacked ones. Five or more fall into rows of three.
 */
const columnsFor = (count: number): number => {
  if (count <= 1) return 1;
  if (count === 2 || count === 4) return 2;
  return 3;
};

export const MediaGallery = ({
  path,
  items,
}: MediaGalleryComponent & { path: string }) => (
  <div
    className={clsx(
      "dc-gallery",
      items.length === 1 && "dc-gallery--single",
      items.length === 3 && "dc-gallery--mosaic",
    )}
    style={
      { "--dc-gallery-columns": columnsFor(items.length) } as React.CSSProperties
    }
  >
    {items.map((item, index) => (
      <Media
        key={index}
        path={childPath(path, "items", index)}
        label={`Item ${index + 1}`}
        url={item.media.url}
        description={item.description ?? undefined}
        spoiler={item.spoiler}
      />
    ))}
  </div>
);
