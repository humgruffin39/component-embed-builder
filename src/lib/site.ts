const FALLBACK = "https://embed.hugh.dev";

const withScheme = (host: string): string =>
  host.startsWith("http") ? host : `https://${host}`;

/**
 * The origin the crawler resolves absolute URLs against.
 *
 * `NEXT_PUBLIC_SITE_URL` wins where it is set. Otherwise production takes the
 * project's production domain, and a preview takes its own deployment URL so
 * it points at itself. `NEXT_PUBLIC_VERCEL_URL` is per deployment and changes
 * on every push, so production must not use it.
 */
const origin = (): string => {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  const production = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production" && production) {
    return withScheme(production);
  }

  const deployment = process.env.NEXT_PUBLIC_VERCEL_URL;
  return deployment ? withScheme(deployment) : FALLBACK;
};

export const SITE_URL = origin().replace(/\/$/, "");

export const SITE_NAME = "Component Embed Builder";

export const SITE_TAGLINE =
  "Build the card Discord shows for your links, then copy the tag.";
