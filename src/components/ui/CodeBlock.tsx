"use client";

import { useEffect, useState } from "react";
import { type BundledLanguage, codeToHtml } from "shiki";

/**
 * Shiki is loaded on demand and produces both themes in one pass, emitting
 * `--shiki-light` / `--shiki-dark` custom properties that globals.css picks
 * between. Until it resolves, the plain text renders in the same place, so
 * the panel never flashes empty.
 */
export const CodeBlock = ({
  code,
  language,
}: {
  code: string;
  language: BundledLanguage;
}) => {
  const [result, setResult] = useState<{ key: string; html: string } | null>(
    null,
  );
  const key = `${language}::${code}`;

  useEffect(() => {
    let current = true;

    codeToHtml(code, {
      lang: language,
      themes: { light: "github-light-default", dark: "vesper" },
      defaultColor: false,
    })
      .then((html) => {
        if (current) setResult({ key, html });
      })
      .catch(() => {});

    return () => {
      current = false;
    };
  }, [key, code, language]);

  // Anything the highlighter has not caught up with falls back to plain text.
  const html = result?.key === key ? result.html : null;

  if (html === null) {
    return (
      <pre className="p-3 font-mono text-[12px] leading-relaxed whitespace-pre text-muted">
        {code}
      </pre>
    );
  }

  return (
    <div
      className="[&_pre]:bg-transparent! [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[12px] [&_pre]:leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
