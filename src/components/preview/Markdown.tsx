import { Fragment, type ReactNode, useState } from "react";
import { type MarkdownNode, parseMarkdown } from "./discordMarkdown";

/** Renders Discord markdown as React elements. No HTML is ever injected. */

const asNodes = (content: MarkdownNode["content"]): MarkdownNode[] => {
  if (Array.isArray(content)) return content;
  if (content && typeof content === "object") return [content];
  return [];
};

const asText = (content: MarkdownNode["content"]): string =>
  typeof content === "string" ? content : "";

/** Flattens a node's content to text, for identity checks. */
const plainText = (content: MarkdownNode["content"]): string =>
  typeof content === "string"
    ? content
    : asNodes(content)
        .map((node) => plainText(node.content))
        .join("");

const Spoiler = ({ children, text }: { children: ReactNode; text: string }) => {
  const [revealed, setRevealed] = useState(false);

  // Rewriting the spoiler should hide it again, even though React reuses this
  // element because its position in the tree did not change.
  const [lastText, setLastText] = useState(text);
  if (text !== lastText) {
    setLastText(text);
    setRevealed(false);
  }

  return (
    <span
      className={revealed ? "dc-spoiler dc-spoiler--revealed" : "dc-spoiler"}
      role="button"
      tabIndex={0}
      onClick={() => setRevealed(true)}
      onKeyDown={(event) => event.key === "Enter" && setRevealed(true)}
    >
      {children}
    </span>
  );
};

const renderNodes = (nodes: MarkdownNode[]): ReactNode =>
  nodes.map((node, index) => (
    <Fragment key={index}>{renderNode(node)}</Fragment>
  ));

const renderNode = (node: MarkdownNode): ReactNode => {
  const children = renderNodes(asNodes(node.content));

  switch (node.type) {
    case "text":
    case "escape":
    case "emoticon":
      return asText(node.content);
    case "br":
    case "newline":
      return <br />;
    case "strong":
      return <strong>{children}</strong>;
    case "em":
      return <em>{children}</em>;
    case "underline":
      return <u>{children}</u>;
    case "strikethrough":
      return <s>{children}</s>;
    case "spoiler":
      return <Spoiler text={plainText(node.content)}>{children}</Spoiler>;
    case "inlineCode":
      return <code className="dc-code">{asText(node.content)}</code>;
    case "codeBlock":
      return (
        <pre className="dc-codeblock">
          <code>{asText(node.content)}</code>
        </pre>
      );
    case "blockQuote":
      return <blockquote className="dc-quote">{children}</blockquote>;
    case "heading": {
      const level = Math.min(Number(node.level) || 1, 3);
      const Tag = `h${level}` as "h1" | "h2" | "h3";
      return <Tag className="dc-heading">{children}</Tag>;
    }
    case "subtext":
      return <div className="dc-subtext">{children}</div>;
    case "list": {
      const items = (node.items as MarkdownNode[][]) ?? [];
      const content = items.map((item, index) => (
        <li key={index}>{renderNodes(item)}</li>
      ));
      return node.ordered ? (
        <ol className="dc-list" start={Number(node.start) || 1}>
          {content}
        </ol>
      ) : (
        <ul className="dc-list">{content}</ul>
      );
    }
    case "link":
    case "url":
    case "autolink": {
      const href = String(node.target ?? "");
      const hasLabel = asNodes(node.content).length > 0;
      return (
        <a
          className="dc-link"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {hasLabel ? children : href}
        </a>
      );
    }
    case "emoji":
    case "twemoji":
      return (
        <span className="dc-emoji">
          {typeof node.name === "string" ? node.name : children}
        </span>
      );
    case "user":
    case "role":
    case "channel":
    case "everyone":
    case "here":
    case "slashCommand":
    case "guildNavigation":
      return <span className="dc-mention">{mentionLabel(node)}</span>;
    case "timestamp":
      return <span className="dc-timestamp">{String(node.timestamp ?? "")}</span>;
    default:
      return children;
  }
};

const mentionLabel = (node: MarkdownNode): string => {
  switch (node.type) {
    case "everyone":
      return "@everyone";
    case "here":
      return "@here";
    case "channel":
      return `#${node.id ?? "channel"}`;
    case "role":
      return `@role`;
    case "slashCommand":
      return `/${node.name ?? "command"}`;
    default:
      return `@${node.id ?? "user"}`;
  }
};

export const Markdown = ({ content }: { content: string }) => (
  <>{renderNodes(parseMarkdown(content))}</>
);
