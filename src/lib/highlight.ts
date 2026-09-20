import type { HighlighterCore, LanguageRegistration } from "shiki/core";

/** The grammars the output formats ask for. */
export type Language =
  | "html"
  | "json"
  | "tsx"
  | "astro"
  | "svelte"
  | "markdown";

/**
 * Shiki's default entry carries every grammar and theme it ships with, which
 * is most of a megabyte for the six used here. Each one is fetched on its own
 * instead, the first time a snippet needs it.
 */
const GRAMMARS: Record<Language, () => Promise<{ default: LanguageRegistration[] }>> = {
  html: () => import("@shikijs/langs/html"),
  json: () => import("@shikijs/langs/json"),
  tsx: () => import("@shikijs/langs/tsx"),
  astro: () => import("@shikijs/langs/astro"),
  svelte: () => import("@shikijs/langs/svelte"),
  markdown: () => import("@shikijs/langs/markdown"),
};

/** Both themes in one pass, for the custom properties globals.css picks between. */
const THEMES = {
  themes: { light: "github-light-default", dark: "vesper" },
  defaultColor: false,
} as const;

let core: Promise<HighlighterCore> | null = null;

/**
 * The JavaScript regex engine, so the Oniguruma WebAssembly binary never
 * ships. All six grammars were checked against it.
 */
const highlighter = (): Promise<HighlighterCore> => {
  core ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, dark, light] =
      await Promise.all([
        import("shiki/core"),
        import("shiki/engine/javascript"),
        import("@shikijs/themes/vesper"),
        import("@shikijs/themes/github-light-default"),
      ]);

    return createHighlighterCore({
      themes: [dark.default, light.default],
      langs: [],
      engine: createJavaScriptRegexEngine(),
    });
  })();

  return core;
};

/**
 * Grammars a language embeds. Markdown carries no fenced block languages of
 * its own, so without this the snippets inside the prompt come out flat.
 */
const EMBEDDED: Partial<Record<Language, readonly Language[]>> = {
  markdown: ["html"],
};

const loading = new Map<Language, Promise<unknown>>();

const withLanguage = async (language: Language): Promise<HighlighterCore> => {
  const shiki = await highlighter();
  if (shiki.getLoadedLanguages().includes(language)) return shiki;

  let pending = loading.get(language);
  if (!pending) {
    const wanted = [language, ...(EMBEDDED[language] ?? [])];
    pending = Promise.all(
      wanted.map((name) => GRAMMARS[name]().then((grammar) => shiki.loadLanguage(grammar.default))),
    );
    loading.set(language, pending);
  }
  await pending;
  return shiki;
};

export const highlight = async (code: string, language: Language): Promise<string> => {
  const shiki = await withLanguage(language);
  return shiki.codeToHtml(code, { lang: language, ...THEMES });
};
