/** Absolute URLs the crawler can resolve, overridable per deployment. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://component-embed-builder.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "Component Embed Builder";

export const SITE_TAGLINE =
  "Build the card Discord shows for your links, then copy the tag.";
