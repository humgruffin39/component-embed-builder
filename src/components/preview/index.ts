/**
 * Discord component embed renderer.
 *
 * A package boundary: everything here is driven by the payload passed in, with
 * no knowledge of the builder's store, routing or framework. Its only imports
 * are React, clsx, the markdown parser, and the wire-format types.
 */

export { ComponentEmbed, type PreviewTheme } from "./ComponentEmbed";
export { Container } from "./Container";
export { Section } from "./Section";
export { TextDisplay } from "./TextDisplay";
export { MediaGallery } from "./MediaGallery";
export { Separator } from "./Separator";
export { ActionRow } from "./ActionRow";
export { LinkButton } from "./LinkButton";
export { Markdown } from "./Markdown";
export { parseMarkdown, type MarkdownNode } from "./discordMarkdown";
