import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { EMBED_TAG, REPO_URL } from "@/lib/constants";
import { escapeForScript, minifyPayload, toHexColor } from "@/lib/generators/shared";
import { selfEmbed } from "@/lib/selfEmbed";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const embed = selfEmbed();

/** The same claim as the metadata, in the shape a search engine parses. */
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  description: SITE_TAGLINE,
  url: SITE_URL,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript.",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  sameAs: [REPO_URL],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  // The document carries its state in the hash, which never reaches a crawler,
  // so every shared link is the same page and points back at the bare one.
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: SITE_NAME,
    description: SITE_TAGLINE,
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: { card: "summary", title: SITE_NAME, description: SITE_TAGLINE },
  other: { "theme-color": toHexColor(embed.accentColor) ?? "#5865f2" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
      // The head script writes data-restoring here before React hydrates, so
      // this element alone is allowed to differ from what the server sent.
      suppressHydrationWarning
    >
      <head>
        {/* Runs before anything paints. The hash never reaches the server, so
            without this a shared link shows the default document first. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(/[#&]s=/.test(location.hash))document.documentElement.dataset.restoring=''}catch(e){}",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: escapeForScript(JSON.stringify(structuredData)),
          }}
        />
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
