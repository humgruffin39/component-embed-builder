import { REPO_URL } from "@/lib/constants";
import {
  type ContainerNode,
  createActionRow,
  createButton,
  createContainer,
  createTextDisplay,
} from "@/lib/document";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

/**
 * The builder's own component embed, built with the builder's own model, so
 * the card Discord shows for this page is an example of the output.
 */
export const selfEmbed = (): ContainerNode => {
  const links = createActionRow();
  links.components = [
    { ...createButton(), label: "Open the builder", url: SITE_URL },
    { ...createButton(), label: "Source", url: REPO_URL },
  ];

  return createContainer([
    createTextDisplay(`# ${SITE_NAME}\n${SITE_TAGLINE}`),
    createTextDisplay(
      [
        "- See it the way a Discord client draws it",
        "- Catch what Discord would reject",
        "- Copy it out as HTML, JSON, Next.js, Astro or SvelteKit",
      ].join("\n"),
    ),
    links,
  ]);
};
