const FALLBACK = "https://embed.hugh.dev";

/**
 * The origin the crawler resolves absolute URLs against.
 *
 * `NEXT_PUBLIC_SITE_URL` wins where it is set. Otherwise a Vercel deployment
 * uses its own URL, so preview builds still produce a card that points at
 * themselves rather than at production.
 */
const origin = (): string => {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL;
  return vercel ? `https://${vercel}` : FALLBACK;
};

export const SITE_URL = origin().replace(/\/$/, "");

export const SITE_NAME = "Component Embed Builder";

export const SITE_TAGLINE =
  "Build the card Discord shows for your links, then copy the tag.";
