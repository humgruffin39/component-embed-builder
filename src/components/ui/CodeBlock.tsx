"use client";

import { useEffect, useState } from "react";
import { type BundledLanguage, codeToHtml } from "shiki";

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

interface Result {
  language: BundledLanguage;
  key: string;
  html: string;
}

/**
 * Shiki is loaded on demand and produces both themes in one pass, emitting
 * `--shiki-light` / `--shiki-dark` custom properties that globals.css picks
 * between.
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
  language: BundledLanguage;
}) => {
  const [result, setResult] = useState<Result | null>(null);
  const key = `${language}::${code}`;

  useEffect(() => {
    let current = true;

    codeToHtml(code, {
      lang: language,
      themes: { light: "github-light-default", dark: "vesper" },
      defaultColor: false,
    })
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
