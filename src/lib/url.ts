/**
 * Accepts what people actually type. `ign.bio/tom` and `www.example.com` are
 * treated as https URLs; anything that already names a scheme is left alone.
 */
export const normalizeUrl = (input: string): string => {
  const value = input.trim();
  if (value.length === 0) return value;
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
};

/**
 * The file extension of a URL, or "" when it has none.
 *
 * The last dot in the whole string is not good enough: `https://a.dev/image`
 * would give `dev/image`. Only the final path segment can carry one.
 */
export const extensionOf = (url: string): string => {
  const path = url.split(/[?#]/, 1)[0];
  const segment = path.slice(path.lastIndexOf("/") + 1);
  const dot = segment.lastIndexOf(".");
  return dot === -1 ? "" : segment.slice(dot + 1).toLowerCase();
};
