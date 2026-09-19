import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The builder reads no cookies and stores nothing, so the only thing worth
  // saying is that nobody should be framing it or sniffing its responses.
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    },
  ],
};

export default nextConfig;
