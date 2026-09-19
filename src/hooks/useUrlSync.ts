"use client";

import { useEffect, useRef, useState } from "react";
import type { ContainerNode } from "@/lib/document";
import {
  HASH_LENGTH_WARNING,
  buildHash,
  decodeDocument,
  encodeDocument,
  readHash,
} from "@/lib/serialize";
import { useBuilder } from "@/store/builder";

const DEBOUNCE_MS = 300;

/**
 * Mirrors the document into the URL hash, so a link is the whole share
 * mechanism. Returns true once the hash grows long enough to risk truncation.
 */
export const useUrlSync = (root: ContainerNode): boolean => {
  const replaceDocument = useBuilder((state) => state.replaceDocument);
  const [tooLong, setTooLong] = useState(false);
  const restored = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;

    const encoded = readHash(window.location.hash);
    const decoded = encoded ? decodeDocument(encoded) : null;
    if (decoded) replaceDocument(decoded);

    // The head script hid the default document on the way in. Whether the hash
    // decoded or turned out to be rubbish, there is nothing left to wait for.
    delete document.documentElement.dataset.restoring;
  }, [replaceDocument]);

  // replaceState does not fire this; the browser's own back and forward do.
  useEffect(() => {
    const onHashChange = () => {
      const encoded = readHash(window.location.hash);
      const decoded = encoded ? decodeDocument(encoded) : null;
      if (decoded) replaceDocument(decoded);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [replaceDocument]);

  useEffect(() => {
    if (!restored.current) return;

    const timer = setTimeout(() => {
      const hash = buildHash(encodeDocument(root));
      setTooLong(hash.length > HASH_LENGTH_WARNING);
      window.history.replaceState(null, "", hash);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [root]);

  return tooLong;
};
