"use client";

import { type MouseEvent, createContext, useContext } from "react";

export { ROOT_PATH, childPath } from "@/lib/path";

/**
 * Selection inside the preview, addressed by the structural paths in
 * `lib/path.ts`. The renderer labels its output with a path and hands it back
 * on click. It never learns what an editor node is.
 */

interface Selection {
  selectedPath: string | null;
  onSelect: ((path: string) => void) | null;
  /** Some chrome only exists on one client; the ALT badge is mobile-only. */
  platform: "desktop" | "mobile";
}

export const SelectionContext = createContext<Selection>({
  selectedPath: null,
  onSelect: null,
  platform: "desktop",
});

export interface SelectableProps {
  className?: string;
  "data-path"?: string;
  "data-label"?: string;
  "data-selected"?: string;
  onClick?: (event: MouseEvent) => void;
}

/**
 * Props that make an element selectable. Without a handler they come back
 * empty, so a consumer that only wants to render gets untouched markup.
 */
export const useSelection = () => useContext(SelectionContext);

export const useSelectable = (path: string, label: string): SelectableProps => {
  const { selectedPath, onSelect } = useContext(SelectionContext);
  if (!onSelect) return {};

  return {
    className: "dc-selectable",
    "data-path": path,
    "data-label": label,
    "data-selected": selectedPath === path ? "" : undefined,
    onClick: (event: MouseEvent) => {
      // Buttons and markdown links would otherwise navigate away, and an outer
      // component would take the click as its own.
      event.preventDefault();
      event.stopPropagation();
      onSelect(path);
    },
  };
};
