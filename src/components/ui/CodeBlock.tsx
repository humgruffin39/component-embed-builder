"use client";

import { useEffect, useState } from "react";
import { highlight, type Language } from "@/lib/highlight";

/** Roughly one character of the mono face, for sizing the skeleton bars. */
const CHAR = 0.6;

/**
 * Bars laid out from the real code, so the placeholder has the shape of what
 * is coming and nothing shifts when it arrives.
 */
const Skeleton = ({ code }: { code: string }) => (
  <div
    aria-hidden
    className="animate-[pulse-soft_1.6s_ease-in-out_infinite] p-3 font-mono text-[12px] leading-relaxed"
  >
    {code
      .split("\n")
      .slice(0, 40)
      .map((line, index) => {
        const indent = Math.min(line.length - line.trimStart().length, 16);
        const length = Math.min(line.trim().length, 72);
        return (
          <div key={index} className="flex items-center" style={{ height: "1.625em" }}>
            {length > 0 && (
              <span
                className="block h-[0.55em] rounded-full bg-line"
                style={{
                  marginLeft: `${indent * CHAR}em`,
                  width: `${length * CHAR}em`,
                }}
              />
            )}
          </div>
        );
      })}
  </div>
);

/**
 * The payload's line range inside a generated snippet.
 *
 * Shiki's HTML grammar treats the body of a `<script>` as plain text unless it
 * is JavaScript, so the payload comes out one flat colour. Finding it here
 * lets it be highlighted on its own and put back.
 */
const payloadLines = (code: string): [number, number] | null => {
  const lines = code.split("\n");
  // The line has to be the tag, not a string that contains one. The SvelteKit
  // snippet builds the same tag out of a template literal.
  const open = lines.findIndex(
    (line) =>
      line.trimStart().startsWith("<script") &&
      line.includes('type="application/json"'),
  );
  if (open === -1) return null;
  const close = lines.findIndex(
    (line, index) => index > open && line.trim() === "</script>",
  );
  return close > open + 1 ? [open + 1, close - 1] : null;
};

const CODE_ELEMENT = /(<code[^>]*>)([\s\S]*)(<\/code>)/;

/** Swaps a run of Shiki's one-per-line spans for the same lines from another pass. */
const spliceLines = (
  base: string,
  patch: string,
  from: number,
  to: number,
): string => {
  const outer = CODE_ELEMENT.exec(base);
  const inner = CODE_ELEMENT.exec(patch);
  if (!outer || !inner) return base;

  const lines = outer[2].split("\n");
  if (lines.length <= to) return base;
  lines.splice(from, to - from + 1, ...inner[2].split("\n"));

  const start = outer.index + outer[1].length;
  return base.slice(0, start) + lines.join("\n") + base.slice(start + outer[2].length);
};

interface Result {
  language: Language;
  key: string;
  html: string;
}

/**
 * Shiki is fetched on first use, so nothing about it is in the initial load.
 *
 * While the same language is being re-highlighted, usually because someone is
 * typing, the last result stays on screen. Swapping to a placeholder on every
 * keystroke would flash. A new language has nothing to keep, so that is where
 * the skeleton shows.
 */
export const CodeBlock = ({
  code,
  language,
}: {
  code: string;
  language: Language;
}) => {
  const [result, setResult] = useState<Result | null>(null);
  const key = `${language}::${code}`;

  useEffect(() => {
    let current = true;

    const render = async () => {
      const base = await highlight(code, language);
      const region = payloadLines(code);
      if (!region) return base;

      const [from, to] = region;
      const payload = code.split("\n").slice(from, to + 1).join("\n");
      const patch = await highlight(payload, "json");
      return spliceLines(base, patch, from, to);
    };

    render()
      .then((html) => {
        if (current) setResult({ language, key, html });
      })
      .catch(() => {});

    return () => {
      current = false;
    };
  }, [key, code, language]);

  if (!result || result.language !== language) {
    return <Skeleton code={code} />;
  }

  return (
    <div
      className="[&_pre]:bg-transparent! [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[12px] [&_pre]:leading-relaxed"
      dangerouslySetInnerHTML={{ __html: result.html }}
    />
  );
};
