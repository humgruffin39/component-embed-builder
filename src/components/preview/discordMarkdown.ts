import { SimpleMarkdown, rulesExtended } from "discord-markdown-parser";

/**
 * Discord's markdown dialect, parsed by discord-markdown-parser.
 *
 * The library ships every rule except lists, so one rule is added on top of
 * simple-markdown's own list implementation: only the block-detection is ours,
 * because Discord ends a list at the first non-item line rather than requiring
 * a blank line the way stock markdown does.
 */

export interface MarkdownNode {
  type: string;
  content?: MarkdownNode | MarkdownNode[] | string;
  [key: string]: unknown;
}

const LIST_ITEM = /^( *)([*-]|\d+\.) \S/;

const isOrdered = (bullet: string): boolean => bullet.length > 1;

const matchList: (
  source: string,
  state: { prevCapture?: string[] | null },
) => string[] | null = (source, state) => {
  const previous = state.prevCapture?.[0] ?? "";
  if (previous !== "" && !previous.endsWith("\n")) return null;

  const lines = source.split("\n");
  const head = LIST_ITEM.exec(lines[0]);
  if (!head) return null;

  let end = 1;
  for (; end < lines.length; end += 1) {
    const item = LIST_ITEM.exec(lines[end]);
    if (!item) break;
    // A top-level line of the other bullet family starts a new list.
    if (item[1].length <= head[1].length && isOrdered(item[2]) !== isOrdered(head[2])) {
      break;
    }
  }

  const consumed =
    lines.slice(0, end).join("\n") + (end < lines.length ? "\n" : "");
  return [consumed, head[1], head[2]];
};

const parser = SimpleMarkdown.parserFor({
  ...rulesExtended,
  list: {
    ...SimpleMarkdown.defaultRules.list,
    // After blockQuote (6) and before newline (10), so lists win over plain text.
    order: 9,
    match: matchList as never,
  },
});

export const parseMarkdown = (source: string): MarkdownNode[] =>
  parser(source, { inline: true }) as MarkdownNode[];
