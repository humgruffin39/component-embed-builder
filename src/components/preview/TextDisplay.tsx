import type { TextDisplayComponent } from "@/lib/payload";
import { Markdown } from "./Markdown";

export const TextDisplay = ({ content }: TextDisplayComponent) => (
  <div className="dc-text">
    <Markdown content={content} />
  </div>
);
