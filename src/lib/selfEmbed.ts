import { REPO_URL } from "@/lib/constants";
import {
  type ContainerNode,
  createActionRow,
  createButton,
  createContainer,
  createSection,
  createSeparator,
  createTextDisplay,
  createThumbnail,
} from "@/lib/document";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

/**
 * The builder's own component embed, built with the builder's own model, so
 * the card Discord shows for this page is an example of the output.
 *
 * The thumbnail points at the Open Graph image. `icon.svg` will not do:
 * Discord's crawler takes raster formats only.
 */
export const selfEmbed = (): ContainerNode => {
  const headline = createSection();
  headline.components = [
    createTextDisplay(`# ${SITE_NAME}\n${SITE_TAGLINE}`),
  ];
  headline.accessory = {
    ...createThumbnail(),
    url: `${SITE_URL}/opengraph-image`,
    description: SITE_NAME,
  };

  const links = createActionRow();
  links.components = [
    { ...createButton(), label: "Open the builder", url: SITE_URL },
    { ...createButton(), label: "Source", url: REPO_URL },
  ];

  return createContainer([
    headline,
    createTextDisplay(
      [
        "- Build it in a preview that renders the way a client does",
        "- Every documented limit checked before you copy",
        "- Output for HTML, JSON, Next.js, Astro and SvelteKit",
      ].join("\n"),
    ),
    createSeparator(),
    links,
    createTextDisplay("-# This card was made with the builder."),
  ]);
};
