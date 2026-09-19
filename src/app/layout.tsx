import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { EMBED_TAG } from "@/lib/constants";
import { escapeForScript, minifyPayload, toHexColor } from "@/lib/generators/shared";
import { selfEmbed } from "@/lib/selfEmbed";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const embed = selfEmbed();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_TAGLINE,
  openGraph: {
    type: "website",
    title: SITE_NAME,
    description: SITE_TAGLINE,
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  other: { "theme-color": toHexColor(embed.accentColor) ?? "#5865f2" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <head>
        {/* The tool's own link preview, rendered server-side for the crawler. */}
        <script
          id={EMBED_TAG.id}
          type={EMBED_TAG.mimeType}
          dangerouslySetInnerHTML={{
            __html: escapeForScript(minifyPayload(embed)),
          }}
        />
      </head>
      <body className="min-h-full">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
