import { lookup } from "node:dns/promises";

/**
 * Guards the import endpoint against being used to reach private networks.
 *
 * Host names are never trusted on their own: a public name can resolve to a
 * loopback or link-local address, so every resolved address is checked.
 */

const IPV4_BLOCKS: [string, number][] = [
  ["0.0.0.0", 8], // this network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link local, includes cloud metadata
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, includes broadcast
];

const toIPv4 = (address: string): number | null => {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = (value << 8) | octet;
  }
  return value >>> 0;
};

const toIPv6Bytes = (address: string): number[] | null => {
  const [head, tail] = address.split("::", 2);
  const expand = (group: string) =>
    group.length === 0 ? [] : group.split(":").filter((part) => part.length > 0);

  const left = expand(head ?? "");
  const right = address.includes("::") ? expand(tail ?? "") : [];
  const missing = 8 - left.length - right.length;
  if (!address.includes("::") && left.length !== 8) return null;
  if (missing < 0) return null;

  const groups = [
    ...left,
    ...Array.from({ length: address.includes("::") ? missing : 0 }, () => "0"),
    ...right,
  ];

  const bytes: number[] = [];
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/i.test(group)) return null;
    const value = Number.parseInt(group, 16);
    bytes.push(value >> 8, value & 0xff);
  }
  return bytes.length === 16 ? bytes : null;
};

const isPrivateIPv4 = (address: string): boolean => {
  const value = toIPv4(address);
  if (value === null) return true;
  return IPV4_BLOCKS.some(([block, bits]) => {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (value & mask) === (toIPv4(block)! & mask);
  });
};

const isPrivateIPv6 = (address: string): boolean => {
  const bytes = toIPv6Bytes(address.replace(/%.*$/, ""));
  if (!bytes) return true;

  // IPv4-mapped (::ffff:a.b.c.d) reaches the IPv4 stack, so check it as IPv4.
  const mapped = bytes.slice(0, 12);
  if (
    mapped.slice(0, 10).every((byte) => byte === 0) &&
    mapped[10] === 0xff &&
    mapped[11] === 0xff
  ) {
    return isPrivateIPv4(bytes.slice(12).join("."));
  }

  if (bytes.every((byte) => byte === 0)) return true; // unspecified
  if (bytes.slice(0, 15).every((byte) => byte === 0) && bytes[15] === 1) {
    return true; // loopback
  }
  if ((bytes[0] & 0xfe) === 0xfc) return true; // unique local
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80) return true; // link local
  if (bytes[0] === 0xff) return true; // multicast
  if (bytes[0] === 0x20 && bytes[1] === 0x01 && bytes[2] === 0x0d) return true; // documentation
  return false;
};

export const isPrivateAddress = (address: string): boolean =>
  address.includes(":") ? isPrivateIPv6(address) : isPrivateIPv4(address);

export type UrlRejection =
  | "scheme"
  | "port"
  | "credentials"
  | "hostname"
  | "private-address";

export const checkUrlShape = (value: string): UrlRejection | null => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return "hostname";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "scheme";
  if (url.username.length > 0 || url.password.length > 0) return "credentials";
  if (url.hostname.length === 0) return "hostname";
  if (url.port !== "" && url.port !== "80" && url.port !== "443") return "port";
  return null;
};

/** Resolves the host and rejects it if any address is not publicly routable. */
export const assertPublicUrl = async (
  value: string,
): Promise<UrlRejection | null> => {
  const shape = checkUrlShape(value);
  if (shape) return shape;

  const { hostname } = new URL(value);
  const bare = hostname.replace(/^\[|\]$/g, "");
  if (/^[\d.]+$/.test(bare) || bare.includes(":")) {
    return isPrivateAddress(bare) ? "private-address" : null;
  }

  try {
    const addresses = await lookup(bare, { all: true, verbatim: true });
    if (addresses.length === 0) return "hostname";
    return addresses.some((entry) => isPrivateAddress(entry.address))
      ? "private-address"
      : null;
  } catch {
    return "hostname";
  }
};

export const REJECTION_MESSAGES: Record<UrlRejection, string> = {
  scheme: "Only http and https URLs can be imported.",
  port: "Only the standard http and https ports can be imported.",
  credentials: "Remove the credentials from the URL.",
  hostname: "That host could not be resolved.",
  "private-address": "That address is not reachable from the public internet.",
};
