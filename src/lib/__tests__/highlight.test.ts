import { describe, expect, it } from "vitest";
import { codeToHtml } from "shiki";
import { createContainer, createTextDisplay } from "@/lib/document";
import { OUTPUT_FORMATS } from "@/lib/generators";
import { highlight } from "@/lib/highlight";

const document = () =>
  createContainer([createTextDisplay("# Patch Notes\nWhat changed")]);

/** How many distinct colours one pass produced, which flat text cannot fake. */
const colours = (html: string): number =>
  new Set([...html.matchAll(/--shiki-dark:([^;"]+)/g)].map((match) => match[1])).size;

describe("highlighter", () => {
  /**
   * The app fetches grammars one at a time through the JavaScript regex
   * engine. A grammar that engine cannot compile, or an embedded one that was
   * never asked for, comes back as flat text rather than as an error, so each
   * format is measured against what Shiki's own bundle produces.
   */
  it.each(OUTPUT_FORMATS.map((output) => [output.id, output] as const))(
    "colours %s the same as the full bundle",
    async (_id, output) => {
      const code = output.generate(document());
      const full = await codeToHtml(code, {
        lang: output.language,
        themes: { light: "github-light-default", dark: "vesper" },
        defaultColor: false,
      });

      expect(colours(full)).toBeGreaterThan(1);
      expect(colours(await highlight(code, output.language))).toBe(colours(full));
    },
  );
});
