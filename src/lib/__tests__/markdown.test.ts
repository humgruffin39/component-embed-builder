import { describe, expect, it } from "vitest";
import { type MarkdownNode, parseMarkdown } from "@/components/preview/discordMarkdown";

const types = (nodes: MarkdownNode[]): string[] =>
  nodes.map((node) => node.type);

describe("discord markdown", () => {
  it("parses headings, subtext and inline marks", () => {
    expect(types(parseMarkdown("# Title"))).toEqual(["heading"]);
    expect(types(parseMarkdown("-# Small"))).toEqual(["subtext"]);
    expect(types(parseMarkdown("**b**"))).toEqual(["strong"]);
    expect(types(parseMarkdown("||hidden||"))).toEqual(["spoiler"]);
    expect(types(parseMarkdown("`code`"))).toEqual(["inlineCode"]);
    expect(types(parseMarkdown("> quoted"))).toEqual(["blockQuote"]);
    expect(types(parseMarkdown("[a](https://e.com)"))).toEqual(["link"]);
  });

  it("parses bullet lists, which the library does not handle on its own", () => {
    const [list] = parseMarkdown("- one\n- two");
    expect(list.type).toBe("list");
    expect(list.ordered).toBe(false);
    expect((list.items as MarkdownNode[][]).length).toBe(2);
  });

  it("parses ordered lists and keeps their start", () => {
    const [list] = parseMarkdown("3. three\n4. four");
    expect(list.type).toBe("list");
    expect(list.ordered).toBe(true);
    expect(list.start).toBe(3);
  });

  it("nests an indented list inside its parent item", () => {
    const [list] = parseMarkdown("- one\n  - nested\n- two");
    const items = list.items as MarkdownNode[][];
    expect(items.length).toBe(2);
    expect(types(items[0])).toContain("list");
  });

  it("ends a list at the first line that is not an item", () => {
    expect(types(parseMarkdown("- one\nafter"))).toEqual(["list", "text"]);
  });

  it("starts a new list when the bullet family changes", () => {
    expect(types(parseMarkdown("- one\n1. two"))).toEqual(["list", "list"]);
  });

  it("does not read a hyphen mid-line as a list", () => {
    expect(types(parseMarkdown("a - b"))).not.toContain("list");
  });
});
