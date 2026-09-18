"use client";

import { useEffect } from "react";
import { useBuilder } from "@/store/builder";

/**
 * The editor owns undo outright: the inputs are controlled, so the browser's
 * own text history is already broken and intercepting the shortcut everywhere
 * is what makes it behave consistently.
 *
 * Redo answers to both conventions — Ctrl/Cmd+Shift+Z and the Windows Ctrl+Y.
 * Cmd+Y is left alone: on macOS it belongs to the browser.
 */
export const useUndoRedo = (): void => {
  const undo = useBuilder((state) => state.undo);
  const redo = useBuilder((state) => state.redo);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey) return;
      const key = event.key.toLowerCase();

      if (key === "y" && event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        redo();
        return;
      }

      if (key === "z" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);
};
