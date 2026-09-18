/**
 * Accepts what people actually type. `ign.bio/tom` and `www.example.com` are
 * treated as https URLs; anything that already names a scheme is left alone.
 */
export const normalizeUrl = (input: string): string => {
  const value = input.trim();
  if (value.length === 0) return value;
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
};
