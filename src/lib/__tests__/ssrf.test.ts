import { describe, expect, it } from "vitest";
import { checkUrlShape, isPrivateAddress } from "@/lib/server/ssrf";

describe("private address detection", () => {
  const blocked = [
    "127.0.0.1",
    "127.1.2.3",
    "0.0.0.0",
    "10.0.0.1",
    "10.255.255.255",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254", // cloud metadata
    "100.64.0.1",
    "192.0.0.1",
    "198.18.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "::1",
    "::",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "ff02::1",
    "::ffff:127.0.0.1", // IPv4-mapped loopback
    "::ffff:169.254.169.254",
    "2001:db8::1",
  ];

  const allowed = [
    "1.1.1.1",
    "8.8.8.8",
    "93.184.216.34",
    "172.32.0.1",
    "172.15.255.255",
    "11.0.0.1",
    "2606:4700:4700::1111",
    "2a00:1450:4001:80e::200e",
  ];

  it.each(blocked)("blocks %s", (address) => {
    expect(isPrivateAddress(address)).toBe(true);
  });

  it.each(allowed)("allows %s", (address) => {
    expect(isPrivateAddress(address)).toBe(false);
  });

  it("blocks anything it cannot parse", () => {
    expect(isPrivateAddress("not-an-address")).toBe(true);
    expect(isPrivateAddress("999.1.1.1")).toBe(true);
    expect(isPrivateAddress("1:2:3")).toBe(true);
  });
});

describe("url shape", () => {
  it("accepts ordinary pages", () => {
    expect(checkUrlShape("https://example.com/post")).toBeNull();
    expect(checkUrlShape("http://example.com:80/")).toBeNull();
  });

  it("rejects other schemes", () => {
    expect(checkUrlShape("file:///etc/passwd")).toBe("scheme");
    expect(checkUrlShape("gopher://example.com")).toBe("scheme");
    expect(checkUrlShape("ftp://example.com")).toBe("scheme");
  });

  it("rejects non standard ports", () => {
    expect(checkUrlShape("http://example.com:6379/")).toBe("port");
    expect(checkUrlShape("http://example.com:8080/")).toBe("port");
  });

  it("rejects embedded credentials", () => {
    expect(checkUrlShape("https://user:pass@example.com")).toBe("credentials");
  });

  it("rejects malformed input", () => {
    expect(checkUrlShape("example.com")).toBe("hostname");
    expect(checkUrlShape("")).toBe("hostname");
  });
});
