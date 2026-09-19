/**
 * Discord component embed renderer.
 *
 * A package boundary: everything here is driven by the payload passed in, with
 * no knowledge of the builder's store, routing or framework. Its only imports
 * are React, clsx, the markdown parser, and the wire-format types. Never the
 * builder's own components. Its one icon is Discord's own path rather than the
 * builder's icon set, because this has to match a client exactly.
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
export { ROOT_PATH, childPath } from "./selection";
